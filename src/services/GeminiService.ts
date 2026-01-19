import type { GoogleGenAI } from '@google/genai';
import type { SupabaseService } from './SupabaseService';
import type { MetadataService, ImageMetadata } from './MetadataService';
import type {
  MediaItem,
  Tier1Response,
  Tier2Response,
  InvestigationStatus,
} from '../lib/types';
import {
  TIER1_SYSTEM_PROMPT,
  TIER1_RESPONSE_SCHEMA,
  TIER2_SYSTEM_PROMPT,
  TIER2_RESPONSE_SCHEMA,
  getTier1UserPrompt,
  getTier2AgentPrompt,
} from '../lib/prompts';
import { Tier1ResponseSchema, Tier2ResponseSchema } from '../lib/types';

interface UploadedFile {
  name: string;
  uri: string;
  mimeType: string;
}

interface FileState {
  state: string;
}

export interface StartInvestigationResult {
  interactionId: string;
  status: InvestigationStatus;
}

export interface InvestigationStatusResult {
  status: InvestigationStatus;
  rawOutput?: string;
  formattedReport?: Tier2Response;
}

export class GeminiService {
  constructor(
    private client: GoogleGenAI,
    private supabaseService: SupabaseService,
    private metadataService: MetadataService,
  ) {}

  async assessTier1(
    text: string,
    mediaItems: MediaItem[],
  ): Promise<Tier1Response> {
    const uploadedFiles: UploadedFile[] = [];
    const metadataResults: {
      metadata: ImageMetadata;
      type: 'image' | 'video';
      index: number;
    }[] = [];

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const { blob, mimeType, buffer } =
        await this.supabaseService.downloadFile(item.path);

      if (item.type === 'image') {
        const metadata =
          await this.metadataService.extractImageMetadata(buffer);
        metadataResults.push({ metadata, type: item.type, index: i });
      } else {
        metadataResults.push({
          metadata: this.metadataService.createVideoMetadataPlaceholder(),
          type: item.type,
          index: i,
        });
      }

      const uploadResult = await this.client.files.upload({
        file: blob,
        config: { mimeType },
      });

      if (item.type === 'video' && uploadResult.name) {
        await this.waitForVideoProcessing(uploadResult.name);
      }

      if (uploadResult.name && uploadResult.uri && uploadResult.mimeType) {
        uploadedFiles.push({
          name: uploadResult.name,
          uri: uploadResult.uri,
          mimeType: uploadResult.mimeType,
        });
      }
    }

    const metadataContext = metadataResults
      .map(({ metadata, type, index }) =>
        this.metadataService.formatMetadataForPrompt(metadata, index, type),
      )
      .join('\n\n');

    const userPrompt = getTier1UserPrompt(text, metadataContext);

    const contents: Array<
      { text: string } | { fileData: { fileUri: string; mimeType: string } }
    > = [
      { text: userPrompt },
      ...uploadedFiles.map((f) => ({
        fileData: { fileUri: f.uri, mimeType: f.mimeType },
      })),
    ];

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: TIER1_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: TIER1_RESPONSE_SCHEMA,
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(responseText);
    return Tier1ResponseSchema.parse(parsed);
  }

  async startInvestigation(
    charityName: string,
    claimContext: string,
  ): Promise<StartInvestigationResult> {
    const input = getTier2AgentPrompt(charityName, claimContext);

    const interaction = await this.client.interactions.create({
      agent: 'deep-research-pro-preview-05-2025',
      input,
      background: true,
    });

    return {
      interactionId: interaction.id,
      status: 'processing',
    };
  }

  async getInvestigationStatus(
    interactionId: string,
  ): Promise<InvestigationStatusResult> {
    const interaction = await this.client.interactions.get(interactionId);

    if (interaction.status === 'completed') {
      const rawOutput = this.extractRawOutput(interaction.outputs);

      return {
        status: 'completed',
        rawOutput,
      };
    }

    if (interaction.status === 'failed' || interaction.status === 'cancelled') {
      return {
        status: 'failed',
      };
    }

    return {
      status: 'processing',
    };
  }

  async formatInvestigationReport(rawOutput: string): Promise<Tier2Response> {
    const formatPrompt = `
You are a report formatter. Take the following raw research output and format it into a structured JSON report.

RAW RESEARCH OUTPUT:
${rawOutput}

Format this into the required JSON structure. Extract all relevant information and organize it properly.
If any information is missing, use reasonable defaults or mark as "Not found".
`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formatPrompt,
      config: {
        systemInstruction: TIER2_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: TIER2_RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(responseText);
    return Tier2ResponseSchema.parse(parsed);
  }

  private extractRawOutput(outputs: unknown[] | undefined): string {
    if (!outputs || outputs.length === 0) {
      return '';
    }

    const textParts: string[] = [];

    for (const output of outputs) {
      if (typeof output === 'object' && output !== null) {
        const obj = output as Record<string, unknown>;
        if (obj.type === 'text' && typeof obj.text === 'string') {
          textParts.push(obj.text);
        } else if (typeof obj.text === 'string') {
          textParts.push(obj.text);
        }
      } else if (typeof output === 'string') {
        textParts.push(output);
      }
    }

    return textParts.join('\n\n');
  }

  private async waitForVideoProcessing(fileName: string): Promise<void> {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      const file = await this.client.files.get({ name: fileName });
      const fileState = file as unknown as FileState;

      if (fileState.state === 'ACTIVE') {
        return;
      }

      if (fileState.state === 'FAILED') {
        throw new Error(`Video processing failed for ${fileName}`);
      }

      await this.sleep(pollInterval);
    }

    throw new Error(`Video processing timed out for ${fileName}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

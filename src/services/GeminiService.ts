import type { GoogleGenAI } from '@google/genai';
import type { SupabaseService } from './SupabaseService';
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
import { CONFIG } from '../lib/config';
import { AIProcessingError } from '../lib/errors';

/**
 * Result from starting an investigation
 */
export interface StartInvestigationResult {
  interactionId: string;
  status: InvestigationStatus;
}

/**
 * Result from checking investigation status
 */
export interface InvestigationStatusResult {
  status: InvestigationStatus;
  rawOutput?: string;
  formattedReport?: Tier2Response;
}

/**
 * Service for interacting with Gemini AI
 * Handles both Tier 1 rapid assessments and Tier 2 deep investigations
 */
export class GeminiService {
  constructor(
    private client: GoogleGenAI,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Performs Tier 1 rapid fraud assessment on a campaign
   * @param text - Campaign claim text to analyze
   * @param mediaItems - Array of media references from Supabase Storage
   * @returns Structured fraud assessment with score, verdict, and evidence analysis
   * @throws AIProcessingError if Gemini fails to respond
   */
  async assessTier1(
    text: string,
    mediaItems: MediaItem[],
  ): Promise<Tier1Response> {
    const mediaUrls: Array<{
      fileData: { fileUri: string; mimeType: string };
    }> = [];

    for (const item of mediaItems) {
      const { url, mimeType } = await this.supabaseService.getFileUrl(
        item.path,
      );
      mediaUrls.push({
        fileData: { fileUri: url, mimeType },
      });
    }

    const userPrompt = getTier1UserPrompt(text, '');

    const contents: Array<
      { text: string } | { fileData: { fileUri: string; mimeType: string } }
    > = [{ text: userPrompt }, ...mediaUrls];

    const response = await this.client.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
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
      throw new AIProcessingError(
        'Tier 1 assessment',
        'No response from Gemini',
      );
    }

    const parsed = JSON.parse(responseText);
    return Tier1ResponseSchema.parse(parsed);
  }

  /**
   * Starts a Tier 2 deep investigation asynchronously
   * @param charityName - Name of the charity to investigate
   * @param claimContext - Context about the fundraising claim
   * @returns Interaction ID for polling status
   */
  async startInvestigation(
    charityName: string,
    claimContext: string,
  ): Promise<StartInvestigationResult> {
    const input = getTier2AgentPrompt(charityName, claimContext);

    const interaction = await this.client.interactions.create({
      agent: CONFIG.DEEP_RESEARCH_AGENT,
      input,
      background: true,
    });

    return {
      interactionId: interaction.id,
      status: 'processing',
    };
  }

  /**
   * Checks the status of an ongoing investigation
   * @param interactionId - The interaction ID from startInvestigation
   * @returns Current status and raw output if completed
   */
  async getInvestigationStatus(
    interactionId: string,
  ): Promise<InvestigationStatusResult> {
    const interaction = await this.client.interactions.get(interactionId);

    if (interaction.status === 'completed') {
      const rawOutput = this.extractRawOutput(interaction.outputs);
      return { status: 'completed', rawOutput };
    }

    if (interaction.status === 'failed' || interaction.status === 'cancelled') {
      return { status: 'failed' };
    }

    return { status: 'processing' };
  }

  /**
   * Formats raw investigation output into structured report
   * @param rawOutput - Raw text from deep research agent
   * @returns Structured Tier2Response
   * @throws AIProcessingError if formatting fails
   */
  async formatInvestigationReport(rawOutput: string): Promise<Tier2Response> {
    const formatPrompt = `
You are a report formatter. Take the following raw research output and format it into a structured JSON report.

RAW RESEARCH OUTPUT:
${rawOutput}

Format this into the required JSON structure. Extract all relevant information and organize it properly.
If any information is missing, use reasonable defaults or mark as "Not found".
`;

    const response = await this.client.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      contents: formatPrompt,
      config: {
        systemInstruction: TIER2_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseJsonSchema: TIER2_RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new AIProcessingError(
        'Report formatting',
        'No response from Gemini',
      );
    }

    const parsed = JSON.parse(responseText);
    return Tier2ResponseSchema.parse(parsed);
  }

  /**
   * Extracts text content from interaction outputs
   */
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
}

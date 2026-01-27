import type { GoogleGenAI } from '@google/genai';
import type { SupabaseService } from './SupabaseService';
import type { MediaItem, AssessmentResult } from '../lib/types';
import type { Forensics } from '../lib/schemas/output';
import {
  ASSESSMENT_SYSTEM_PROMPT,
  ASSESSMENT_RESPONSE_SCHEMA,
  getAssessmentPrompt,
  getFormatPrompt,
} from '../lib/prompts';
import { AssessmentResultSchema } from '../lib/types';
import { CONFIG } from '../lib/config';
import { AIProcessingError } from '../lib/errors';

/** Content part for Gemini API */
type ContentPart =
  | { text: string }
  | { fileData: { fileUri: string; mimeType: string } };

/**
 * Configuration for Gemini AI client
 */
interface GeminiConfig {
  readonly model: string;
}

/**
 * Dependencies for GeminiService (Dependency Injection)
 */
interface GeminiServiceDeps {
  readonly client: GoogleGenAI;
  readonly storage: SupabaseService;
  readonly config?: Partial<GeminiConfig>;
}

/**
 * Service for AI-powered fraud detection using Gemini
 * Implements two-step analysis: raw analysis with tools, then structured JSON extraction
 */
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly storage: SupabaseService;
  private readonly model: string;

  constructor(deps: GeminiServiceDeps);
  constructor(client: GoogleGenAI, storage: SupabaseService);
  constructor(
    clientOrDeps: GoogleGenAI | GeminiServiceDeps,
    storage?: SupabaseService,
  ) {
    // Support both dependency injection patterns
    if ('client' in clientOrDeps) {
      this.client = clientOrDeps.client;
      this.storage = clientOrDeps.storage;
      this.model = clientOrDeps.config?.model ?? CONFIG.GEMINI_MODEL;
    } else {
      this.client = clientOrDeps;
      this.storage = storage!;
      this.model = CONFIG.GEMINI_MODEL;
    }
  }

  /**
   * Performs comprehensive fraud assessment on a campaign
   * @param text - Campaign claim text to analyze
   * @param mediaItems - Array of media references from storage
   * @param forensics - Optional forensic data from blockchain/EXIF/reverse image
   * @returns Structured fraud assessment with score, verdict, and evidence
   */
  async assess(
    text: string,
    mediaItems: MediaItem[],
    forensics?: Forensics | null,
  ): Promise<AssessmentResult> {
    const contentParts = await this.buildContentParts(
      text,
      mediaItems,
      forensics,
    );
    const rawAnalysis = await this.analyzeWithSearch(contentParts);
    return this.formatToStructuredResult(rawAnalysis);
  }

  /**
   * Builds content parts array for Gemini API from text and media
   */
  private async buildContentParts(
    text: string,
    mediaItems: MediaItem[],
    forensics?: Forensics | null,
  ): Promise<ContentPart[]> {
    const textPart: ContentPart = {
      text: getAssessmentPrompt(text, forensics),
    };
    const mediaParts = await this.resolveMediaUrls(mediaItems);
    return [textPart, ...mediaParts];
  }

  /**
   * Resolves media items to Gemini-compatible file data
   */
  private async resolveMediaUrls(
    mediaItems: MediaItem[],
  ): Promise<ContentPart[]> {
    const parts: ContentPart[] = [];

    for (const item of mediaItems) {
      const { url, mimeType } = await this.storage.getFileUrl(item.path);
      parts.push({ fileData: { fileUri: url, mimeType } });
    }

    return parts;
  }

  /**
   * Performs raw analysis using Gemini with Google Search tool
   */
  private async analyzeWithSearch(contents: ContentPart[]): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: ASSESSMENT_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawAnalysis = response.text;
    if (!rawAnalysis) {
      throw new AIProcessingError('Assessment', 'No response from analysis');
    }

    return rawAnalysis;
  }

  /**
   * Formats raw analysis into structured JSON result
   */
  private async formatToStructuredResult(
    rawAnalysis: string,
  ): Promise<AssessmentResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: getFormatPrompt(rawAnalysis),
      config: {
        responseMimeType: 'application/json',
        responseSchema: ASSESSMENT_RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new AIProcessingError('Formatting', 'No response from formatter');
    }

    return AssessmentResultSchema.parse(JSON.parse(responseText));
  }

  /**
   * Investigates creator identity using OSINT techniques with Google Search
   * @param identity - Creator identity (fullName, username, email)
   * @returns Structured identity verification results
   */
  async investigateIdentity(identity: {
    fullName: string;
    username: string;
    email: string;
  }): Promise<import('../lib/schemas/output').IdentityForensics> {
    const {
      IDENTITY_OSINT_PROMPT,
      IDENTITY_RESPONSE_SCHEMA,
      getIdentityPrompt,
    } = await import('../lib/prompts');
    const { IdentityForensicsSchema } = await import('../lib/schemas/output');

    // Step 1: Conduct OSINT investigation with Google Search
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: getIdentityPrompt(identity),
      config: {
        systemInstruction: IDENTITY_OSINT_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawInvestigation = response.text;
    if (!rawInvestigation) {
      throw new AIProcessingError(
        'Identity Investigation',
        'No response from investigation',
      );
    }

    // Step 2: Format results into structured JSON
    const formatResponse = await this.client.models.generateContent({
      model: this.model,
      contents: `Based on this OSINT investigation, extract structured results:\n\n${rawInvestigation}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: IDENTITY_RESPONSE_SCHEMA,
      },
    });

    const formatText = formatResponse.text;
    if (!formatText) {
      throw new AIProcessingError(
        'Identity Formatting',
        'No response from formatter',
      );
    }

    return IdentityForensicsSchema.parse(JSON.parse(formatText));
  }
}

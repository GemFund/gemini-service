import type { GoogleGenAI } from '@google/genai';
import type { SupabaseService } from './SupabaseService';
import type { MediaItem, AssessmentResult } from '../lib/types';
import {
  ASSESSMENT_SYSTEM_PROMPT,
  ASSESSMENT_RESPONSE_SCHEMA,
  getAssessmentPrompt,
} from '../lib/prompts';
import { AssessmentResultSchema } from '../lib/types';
import { CONFIG } from '../lib/config';
import { AIProcessingError } from '../lib/errors';

/**
 * Service for interacting with Gemini AI
 * Handles fraud assessments for fundraising campaigns
 */
export class GeminiService {
  constructor(
    private client: GoogleGenAI,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Performs fraud assessment on a campaign
   * Uses two-step approach: 1) Analysis with Google Search, 2) Format to JSON
   * @param text - Campaign claim text to analyze
   * @param mediaItems - Array of media references from Supabase Storage
   * @returns Structured fraud assessment with score, verdict, and evidence analysis
   * @throws AIProcessingError if Gemini fails to respond
   */
  async assess(
    text: string,
    mediaItems: MediaItem[],
  ): Promise<AssessmentResult> {
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

    const userPrompt = getAssessmentPrompt(text);

    const contents: Array<
      { text: string } | { fileData: { fileUri: string; mimeType: string } }
    > = [{ text: userPrompt }, ...mediaUrls];

    const analysisResponse = await this.client.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: ASSESSMENT_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawAnalysis = analysisResponse.text;
    if (!rawAnalysis) {
      throw new AIProcessingError(
        'Assessment',
        'No response from Gemini analysis',
      );
    }

    // Step 2: Format the analysis into structured JSON
    const formatPrompt = `You are a JSON formatter. Based on the fraud assessment analysis below, extract and structure the results.

FRAUD ASSESSMENT ANALYSIS:
${rawAnalysis}

Extract the following fields:
- score: A number from 0-100 indicating credibility (higher = more credible)
- verdict: One of "CREDIBLE", "SUSPICIOUS", or "FRAUDULENT"
- summary: A brief explanation of the findings
- flags: An array of string indicators found (e.g., "hospital_verified", "cost_reasonable", "urgency_trap")
- evidence_match: Object with booleans for:
  - location_verified: Whether location claims are verified
  - visuals_match_text: Whether visuals align with the claim
  - search_corroboration: Whether external search supports the claim
  - metadata_consistent: Whether visual quality/artifacts appear consistent

Be accurate and base your extraction only on the analysis provided.`;

    const formatResponse = await this.client.models.generateContent({
      model: CONFIG.GEMINI_MODEL,
      contents: formatPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: ASSESSMENT_RESPONSE_SCHEMA,
      },
    });

    const responseText = formatResponse.text;
    if (!responseText) {
      throw new AIProcessingError(
        'Formatting',
        'No response from Gemini formatter',
      );
    }

    const parsed = JSON.parse(responseText);
    return AssessmentResultSchema.parse(parsed);
  }
}

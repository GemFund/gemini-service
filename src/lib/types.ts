import { z } from '@hono/zod-openapi';
import type { GeminiService } from '../services/GeminiService';
import type { SupabaseService } from '../services/SupabaseService';
import type { MetadataService } from '../services/MetadataService';

export type Variables = {
  services: {
    gemini: GeminiService;
    supabase: SupabaseService;
    metadata: MetadataService;
  };
  user?: { id: string };
};

export type AppType = {
  Bindings: Env;
  Variables: Variables;
};

export const MediaItemSchema = z
  .object({
    path: z.string().min(1).openapi({ example: 'campaigns/123/evidence.jpg' }),
    type: z.enum(['image', 'video']).openapi({ example: 'image' }),
  })
  .openapi('MediaItem');

export const AssessSchema = z
  .object({
    text: z.string().min(10).openapi({
      example:
        'Help save my child who needs urgent heart surgery. We need $50,000.',
    }),
    media: z
      .array(MediaItemSchema)
      .default([])
      .openapi({
        example: [{ path: 'campaigns/123/photo.jpg', type: 'image' }],
      }),
  })
  .openapi('AssessInput');

export const InvestigateSchema = z
  .object({
    charity_name: z
      .string()
      .min(2)
      .openapi({ example: 'Hearts for Children Foundation' }),
    claim_context: z.string().min(10).openapi({
      example:
        'Fundraising campaign for pediatric heart surgeries in developing countries',
    }),
  })
  .openapi('InvestigateInput');

export const InvestigateStatusSchema = z
  .object({
    interaction_id: z
      .string()
      .min(1)
      .openapi({ example: 'interaction_abc123' }),
  })
  .openapi('InvestigateStatusInput');

export const EvidenceMatchSchema = z
  .object({
    location_verified: z.boolean().openapi({ example: true }),
    visuals_match_text: z.boolean().openapi({ example: true }),
    search_corroboration: z.boolean().openapi({ example: false }),
    metadata_consistent: z.boolean().openapi({ example: true }),
  })
  .openapi('EvidenceMatch');

export const Tier1ResponseSchema = z
  .object({
    score: z.number().min(0).max(100).openapi({ example: 72 }),
    verdict: z
      .enum(['CREDIBLE', 'SUSPICIOUS', 'FRAUDULENT'])
      .openapi({ example: 'CREDIBLE' }),
    summary: z
      .string()
      .openapi({
        example: 'Claim appears legitimate with minor inconsistencies',
      }),
    flags: z
      .array(z.string())
      .openapi({ example: ['hospital_verified', 'cost_reasonable'] }),
    evidence_match: EvidenceMatchSchema,
  })
  .openapi('Tier1Response');

export const ResearchSourceSchema = z
  .object({
    title: z
      .string()
      .openapi({ example: 'Charity Navigator - Hearts for Children' }),
    url: z
      .string()
      .openapi({ example: 'https://charitynavigator.org/hearts-for-children' }),
    relevance: z
      .string()
      .openapi({ example: 'Official charity rating and financial reports' }),
  })
  .openapi('ResearchSource');

export const Tier2ResponseSchema = z
  .object({
    charity_name: z
      .string()
      .openapi({ example: 'Hearts for Children Foundation' }),
    registration_status: z.object({
      is_registered: z.boolean().openapi({ example: true }),
      registry_name: z
        .string()
        .optional()
        .openapi({ example: 'IRS 501(c)(3)' }),
      registration_number: z
        .string()
        .optional()
        .openapi({ example: '12-3456789' }),
    }),
    fraud_indicators: z.object({
      scam_reports_found: z.boolean().openapi({ example: false }),
      negative_mentions: z.array(z.string()).openapi({ example: [] }),
      warning_signs: z.array(z.string()).openapi({ example: [] }),
    }),
    financial_transparency: z.object({
      has_public_reports: z.boolean().openapi({ example: true }),
      last_report_year: z.number().optional().openapi({ example: 2025 }),
      notes: z
        .string()
        .openapi({ example: 'Annual reports available on website' }),
    }),
    cost_analysis: z.object({
      claimed_amount_reasonable: z.boolean().openapi({ example: true }),
      market_rate_comparison: z
        .string()
        .openapi({ example: 'Costs align with regional averages' }),
    }),
    overall_risk_level: z
      .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .openapi({ example: 'LOW' }),
    recommendation: z
      .string()
      .openapi({ example: 'Organization appears legitimate and trustworthy' }),
    sources: z.array(ResearchSourceSchema),
  })
  .openapi('Tier2Response');

export const AssessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    tier: z.literal(1).openapi({ example: 1 }),
    data: Tier1ResponseSchema,
    deep_investigation: z
      .enum(['RECOMMENDED', 'OPTIONAL'])
      .openapi({ example: 'OPTIONAL' }),
  })
  .openapi('AssessResponse');

export const InvestigateInitResponseSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123' }),
    status: z
      .enum(['pending', 'processing', 'completed', 'failed'])
      .openapi({ example: 'processing' }),
    message: z
      .string()
      .openapi({ example: 'Investigation started. Poll the status endpoint.' }),
  })
  .openapi('InvestigateInitResponse');

export const InvestigateStatusResponseSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123' }),
    status: z
      .enum(['pending', 'processing', 'completed', 'failed'])
      .openapi({ example: 'completed' }),
    data: Tier2ResponseSchema.optional(),
    raw_output: z
      .string()
      .optional()
      .openapi({ example: 'Full research report text...' }),
  })
  .openapi('InvestigateStatusResponse');

export const ErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.string().openapi({ example: 'Invalid request body' }),
  })
  .openapi('ErrorResponse');

export type MediaItem = z.infer<typeof MediaItemSchema>;
export type AssessInput = z.infer<typeof AssessSchema>;
export type InvestigateInput = z.infer<typeof InvestigateSchema>;
export type InvestigateStatusInput = z.infer<typeof InvestigateStatusSchema>;
export type Tier1Response = z.infer<typeof Tier1ResponseSchema>;
export type Tier2Response = z.infer<typeof Tier2ResponseSchema>;
export type EvidenceMatch = z.infer<typeof EvidenceMatchSchema>;
export type InvestigationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';
export type InvestigateInitResponse = z.infer<
  typeof InvestigateInitResponseSchema
>;
export type InvestigateStatusResponse = z.infer<
  typeof InvestigateStatusResponseSchema
>;

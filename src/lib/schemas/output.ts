import { z } from '@hono/zod-openapi';

export const EvidenceMatchSchema = z
  .object({
    location_verified: z.boolean().openapi({
      description:
        'Whether GPS/location data in images matches claimed location',
      example: true,
    }),
    visuals_match_text: z.boolean().openapi({
      description: 'Whether visual content aligns with the written claim',
      example: true,
    }),
    search_corroboration: z.boolean().openapi({
      description: 'Whether Google Search found supporting evidence',
      example: false,
    }),
    metadata_consistent: z.boolean().openapi({
      description:
        'Whether visual metadata (quality, compression, editing artifacts) appears consistent',
      example: true,
    }),
  })
  .openapi({
    title: 'EvidenceMatch',
    description:
      'Cross-modal verification results comparing text claims with visual evidence',
  });

export const AssessmentResultSchema = z
  .object({
    score: z.number().min(0).max(100).openapi({
      description:
        'Credibility score from 0-100. Higher is more credible. 80-100: Credible, 60-79: Mostly Credible, 40-59: Suspicious, 20-39: Likely Fraudulent, 0-19: Fraudulent',
      example: 72,
    }),
    verdict: z.enum(['CREDIBLE', 'SUSPICIOUS', 'FRAUDULENT']).openapi({
      description: 'Overall verdict based on score thresholds',
      example: 'CREDIBLE',
    }),
    summary: z.string().openapi({
      description: 'Human-readable explanation of the assessment findings',
      example:
        'Campaign appears legitimate. Hospital name verified. Medical costs align with regional averages.',
    }),
    flags: z.array(z.string()).openapi({
      description: 'List of specific indicators found during analysis',
      example: ['hospital_verified', 'cost_reasonable', 'metadata_intact'],
    }),
    evidence_match: EvidenceMatchSchema,
  })
  .openapi({
    title: 'AssessmentResult',
    description: 'Complete fraud assessment results',
  });

export const AssessResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      description: 'Indicates the request was processed successfully',
      example: true,
    }),
    data: AssessmentResultSchema,
    deep_investigation: z.enum(['RECOMMENDED', 'OPTIONAL']).openapi({
      description: 'Whether deeper investigation is recommended based on score',
      example: 'OPTIONAL',
    }),
  })
  .openapi({
    title: 'AssessResponse',
    description: 'Successful response from assessment endpoint',
  });

export type EvidenceMatch = z.infer<typeof EvidenceMatchSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

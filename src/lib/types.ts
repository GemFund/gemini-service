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
    path: z.string().min(1).openapi({
      description:
        'Path to the file in Supabase Storage bucket (without bucket name)',
      example: 'campaigns/123/evidence.jpg',
    }),
    type: z.enum(['image', 'video']).openapi({
      description: 'Type of media file',
      example: 'image',
    }),
  })
  .openapi({
    title: 'MediaItem',
    description: 'Reference to a media file stored in Supabase Storage',
  });

export const AssessSchema = z
  .object({
    text: z.string().min(10).openapi({
      description:
        'The fundraising campaign claim text to analyze (minimum 10 characters)',
      example:
        'Help save my child who needs urgent heart surgery at Johns Hopkins. We need $50,000 by Friday!',
    }),
    media: z
      .array(MediaItemSchema)
      .default([])
      .openapi({
        description:
          'Array of media files from Supabase Storage to analyze. Supports images (JPEG, PNG, WebP) and videos (MP4, WebM)',
        example: [
          { path: 'campaigns/123/medical_report.jpg', type: 'image' },
          { path: 'campaigns/123/hospital_video.mp4', type: 'video' },
        ],
      }),
  })
  .openapi({
    title: 'AssessInput',
    description: 'Input payload for Tier 1 rapid fraud assessment',
  });

export const InvestigateSchema = z
  .object({
    charity_name: z.string().min(2).openapi({
      description: 'Name of the charity or organization to investigate',
      example: 'Hearts for Children Foundation',
    }),
    claim_context: z.string().min(10).openapi({
      description: 'Context about the fundraising claim for targeted research',
      example:
        'Fundraising campaign claims to provide pediatric heart surgeries in developing countries for $5,000 per child',
    }),
  })
  .openapi({
    title: 'InvestigateInput',
    description: 'Input payload for Tier 2 deep investigation',
  });

export const InvestigateStatusSchema = z
  .object({
    interaction_id: z.string().min(1).openapi({
      description: 'The interaction ID returned from the /investigate endpoint',
      example: 'interaction_abc123xyz',
    }),
  })
  .openapi({
    title: 'InvestigateStatusInput',
    description: 'Input payload for polling investigation status',
  });

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
        'Whether EXIF metadata (timestamps, camera info) is consistent and not stripped',
      example: true,
    }),
  })
  .openapi({
    title: 'EvidenceMatch',
    description:
      'Cross-modal verification results comparing text claims with visual evidence',
  });

export const Tier1ResponseSchema = z
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
        'Campaign appears legitimate. Hospital name verified. Medical costs align with regional averages. EXIF data shows images taken at claimed location.',
    }),
    flags: z.array(z.string()).openapi({
      description:
        'List of specific indicators found during analysis. Positive flags indicate verification, negative flags indicate concerns.',
      example: [
        'hospital_verified',
        'cost_reasonable',
        'metadata_intact',
        'no_recycled_content',
      ],
    }),
    evidence_match: EvidenceMatchSchema,
  })
  .openapi({
    title: 'Tier1Response',
    description: 'Complete fraud assessment results from Tier 1 rapid analysis',
  });

export const ResearchSourceSchema = z
  .object({
    title: z.string().openapi({
      description: 'Title of the source document or webpage',
      example: 'Charity Navigator - Hearts for Children Foundation Profile',
    }),
    url: z.string().openapi({
      description: 'URL to the source',
      example: 'https://www.charitynavigator.org/ein/123456789',
    }),
    relevance: z.string().openapi({
      description: 'Why this source is relevant to the investigation',
      example:
        'Official charity rating showing 4-star rating and 89% program efficiency',
    }),
  })
  .openapi({
    title: 'ResearchSource',
    description: 'A verified source found during deep research investigation',
  });

export const RegistrationStatusSchema = z
  .object({
    is_registered: z.boolean().openapi({
      description:
        'Whether the organization is officially registered as a charity/non-profit',
      example: true,
    }),
    registry_name: z.string().optional().openapi({
      description: 'Name of the registry where the charity is registered',
      example: 'IRS 501(c)(3) Tax-Exempt Organizations',
    }),
    registration_number: z.string().optional().openapi({
      description: 'Official registration or EIN number',
      example: '12-3456789',
    }),
  })
  .openapi({
    title: 'RegistrationStatus',
    description: 'Official registration verification results',
  });

export const FraudIndicatorsSchema = z
  .object({
    scam_reports_found: z.boolean().openapi({
      description: 'Whether any scam reports were found online',
      example: false,
    }),
    negative_mentions: z.array(z.string()).openapi({
      description: 'List of negative mentions found in news or complaints',
      example: [],
    }),
    warning_signs: z.array(z.string()).openapi({
      description: 'Specific red flags identified during investigation',
      example: [],
    }),
  })
  .openapi({
    title: 'FraudIndicators',
    description: 'Fraud and scam indicator analysis results',
  });

export const FinancialTransparencySchema = z
  .object({
    has_public_reports: z.boolean().openapi({
      description: 'Whether the organization publishes financial reports',
      example: true,
    }),
    last_report_year: z.number().optional().openapi({
      description: 'Year of the most recent financial report',
      example: 2025,
    }),
    notes: z.string().openapi({
      description: 'Additional notes about financial transparency',
      example:
        'Annual reports and Form 990 available on website. Program expenses at 87%.',
    }),
  })
  .openapi({
    title: 'FinancialTransparency',
    description: 'Financial transparency assessment',
  });

export const CostAnalysisSchema = z
  .object({
    claimed_amount_reasonable: z.boolean().openapi({
      description:
        'Whether the claimed fundraising amount is reasonable for the stated purpose',
      example: true,
    }),
    market_rate_comparison: z.string().openapi({
      description: 'Comparison of claimed costs with market rates',
      example:
        'Claimed $5,000 per surgery aligns with pediatric cardiac surgery costs in target regions ($3,000-$8,000 range)',
    }),
  })
  .openapi({
    title: 'CostAnalysis',
    description: 'Cost verification and market rate comparison',
  });

export const Tier2ResponseSchema = z
  .object({
    charity_name: z.string().openapi({
      description: 'Name of the investigated organization',
      example: 'Hearts for Children Foundation',
    }),
    registration_status: RegistrationStatusSchema,
    fraud_indicators: FraudIndicatorsSchema,
    financial_transparency: FinancialTransparencySchema,
    cost_analysis: CostAnalysisSchema,
    overall_risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).openapi({
      description:
        'Overall risk assessment. LOW: Safe, MEDIUM: Some concerns, HIGH: Multiple red flags, CRITICAL: Avoid',
      example: 'LOW',
    }),
    recommendation: z.string().openapi({
      description: 'Final recommendation based on all findings',
      example:
        'Organization is legitimate with strong transparency. Safe to donate. Verified registration, good financial practices, and no fraud reports.',
    }),
    sources: z.array(ResearchSourceSchema).openapi({
      description: 'All sources consulted during the investigation',
    }),
  })
  .openapi({
    title: 'Tier2Response',
    description: 'Complete investigation dossier from Tier 2 deep research',
  });

export const AssessResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      description: 'Indicates the request was processed successfully',
      example: true,
    }),
    tier: z.literal(1).openapi({
      description: 'Assessment tier level (always 1 for this endpoint)',
      example: 1,
    }),
    data: Tier1ResponseSchema,
    deep_investigation: z.enum(['RECOMMENDED', 'OPTIONAL']).openapi({
      description:
        'Whether Tier 2 deep investigation is recommended based on score. RECOMMENDED if score < 50, otherwise OPTIONAL',
      example: 'OPTIONAL',
    }),
  })
  .openapi({
    title: 'AssessResponse',
    description: 'Successful response from Tier 1 assessment endpoint',
  });

export const InvestigateInitResponseSchema = z
  .object({
    success: z.literal(true).openapi({
      description: 'Indicates the investigation was successfully initiated',
      example: true,
    }),
    interaction_id: z.string().openapi({
      description:
        'Unique ID to poll for investigation status. Save this to check results later.',
      example: 'interaction_abc123xyz',
    }),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).openapi({
      description: 'Current status of the investigation',
      example: 'processing',
    }),
    message: z.string().openapi({
      description: 'Human-readable status message',
      example:
        'Investigation started. Poll the status endpoint to check progress.',
    }),
  })
  .openapi({
    title: 'InvestigateInitResponse',
    description: 'Response when starting a new Tier 2 investigation',
  });

export const InvestigateStatusProcessingSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123xyz' }),
    status: z.literal('processing').openapi({
      description: 'Investigation is still in progress',
      example: 'processing',
    }),
  })
  .openapi({
    title: 'InvestigateStatusProcessing',
    description: 'Response when investigation is still in progress',
  });

export const InvestigateStatusCompletedSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123xyz' }),
    status: z.literal('completed').openapi({
      description: 'Investigation completed successfully',
      example: 'completed',
    }),
    data: Tier2ResponseSchema.openapi({
      description: 'The structured investigation report',
    }),
    raw_output: z.string().optional().openapi({
      description: 'Raw text output from the AI agent (for debugging)',
      example: 'Full research report text...',
    }),
  })
  .openapi({
    title: 'InvestigateStatusCompleted',
    description: 'Response when investigation is completed with full report',
  });

export const InvestigateStatusFailedSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123xyz' }),
    status: z.literal('failed').openapi({
      description: 'Investigation failed',
      example: 'failed',
    }),
  })
  .openapi({
    title: 'InvestigateStatusFailed',
    description: 'Response when investigation has failed',
  });

export const InvestigateStatusResponseSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    interaction_id: z.string().openapi({ example: 'interaction_abc123xyz' }),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).openapi({
      description: 'Current investigation status',
      example: 'completed',
    }),
    data: Tier2ResponseSchema.optional().openapi({
      description:
        'Investigation report (only present when status is completed)',
    }),
    raw_output: z.string().optional().openapi({
      description: 'Raw AI output (only present when status is completed)',
    }),
  })
  .openapi({
    title: 'InvestigateStatusResponse',
    description: 'Response from polling investigation status',
  });

export const ErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({
      description: 'Indicates the request failed',
      example: false,
    }),
    error: z.string().openapi({
      description: 'Human-readable error message',
      example: 'Download failed for campaigns/123/photo.jpg: Object not found',
    }),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response returned when a request fails',
  });

export const UnauthorizedResponseSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.string().openapi({
      description: 'Authentication error message',
      example: 'Invalid or expired JWT token',
    }),
  })
  .openapi({
    title: 'UnauthorizedResponse',
    description: 'Error response when authentication fails',
  });

export const ValidationErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({ example: false }),
    error: z.string().openapi({
      description: 'Validation error details',
      example: 'Invalid input: text must be at least 10 characters',
    }),
  })
  .openapi({
    title: 'ValidationErrorResponse',
    description: 'Error response when request validation fails',
  });

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

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

export const BlockchainForensicsSchema = z
  .object({
    nonce: z.number().openapi({
      description: 'Number of transactions from the wallet',
      example: 42,
    }),
    ageHours: z.number().openapi({
      description: 'Wallet age in hours since first transaction',
      example: 720,
    }),
    washTradingScore: z.number().min(0).max(100).openapi({
      description:
        'Percentage of donors funded by creator (circular funding detection)',
      example: 0,
    }),
    isBurnerWallet: z.boolean().openapi({
      description:
        'Whether the wallet appears to be a burner (low age + nonce)',
      example: false,
    }),
  })
  .openapi({
    title: 'BlockchainForensics',
    description: 'Blockchain-based fraud indicators',
  });

export const ExifForensicsSchema = z
  .object({
    hasGps: z.boolean().openapi({
      description: 'Whether any images contain GPS metadata',
      example: true,
    }),
    hasEdits: z.boolean().openapi({
      description: 'Whether images show signs of editing software',
      example: false,
    }),
    dateMismatch: z.boolean().openapi({
      description: 'Whether dates suggest recycled content',
      example: false,
    }),
    warnings: z.array(z.string()).openapi({
      description: 'EXIF-related warnings or anomalies',
      example: ['Edited with: Adobe Photoshop'],
    }),
  })
  .openapi({
    title: 'ExifForensics',
    description: 'Image metadata forensics',
  });

export const ReverseImageForensicsSchema = z
  .object({
    duplicatesFound: z.number().openapi({
      description: 'Number of matching images found online',
      example: 0,
    }),
    isStockPhoto: z.boolean().openapi({
      description: 'Whether images appear to be stock photos',
      example: false,
    }),
    sources: z
      .array(
        z.object({
          title: z.string(),
          link: z.string(),
          source: z.string(),
        }),
      )
      .openapi({
        description: 'Sources where matching images were found',
        example: [],
      }),
  })
  .openapi({
    title: 'ReverseImageForensics',
    description: 'Reverse image search results for duplicate detection',
  });

export const IdentityForensicsSchema = z
  .object({
    platformsFound: z.number().openapi({
      description: 'Number of platforms where account was found',
      example: 5,
    }),
    scamReportsFound: z.boolean().openapi({
      description: 'Whether scam/fraud reports were found online',
      example: false,
    }),
    isDisposableEmail: z.boolean().openapi({
      description: 'Whether email uses a disposable/temp domain',
      example: false,
    }),
    identityConsistent: z.boolean().openapi({
      description: 'Whether identity appears consistent across platforms',
      example: true,
    }),
    accountAge: z.enum(['new', 'established', 'unknown']).openapi({
      description:
        'Whether online accounts appear newly created or established',
      example: 'established',
    }),
    trustScore: z.number().min(0).max(100).openapi({
      description: 'Overall identity trust score (0-100)',
      example: 75,
    }),
    redFlags: z.array(z.string()).openapi({
      description: 'List of suspicious indicators found',
      example: [],
    }),
    greenFlags: z.array(z.string()).openapi({
      description: 'List of trust indicators found',
      example: ['linkedin_verified', 'established_github'],
    }),
    summary: z.string().openapi({
      description: 'Brief summary of OSINT investigation findings',
      example:
        'Identity appears established with consistent presence across 5 platforms.',
    }),
  })
  .openapi({
    title: 'IdentityForensics',
    description:
      'OSINT investigation results for creator identity verification',
  });

export const ForensicsSchema = z
  .object({
    blockchain: BlockchainForensicsSchema.nullable().openapi({
      description: 'Blockchain analysis results (null if no wallet provided)',
    }),
    exif: ExifForensicsSchema.openapi({
      description: 'EXIF metadata analysis from uploaded images',
    }),
    reverseImage: ReverseImageForensicsSchema.openapi({
      description: 'Reverse image search results',
    }),
    identity: IdentityForensicsSchema.nullable().openapi({
      description:
        'OSINT identity verification (null if no creator info provided)',
    }),
  })
  .openapi({
    title: 'Forensics',
    description: 'Combined forensic analysis results',
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
    forensics: ForensicsSchema.openapi({
      description: 'Detailed forensic analysis from all sources',
    }),
  })
  .openapi({
    title: 'AssessResponse',
    description: 'Successful response from assessment endpoint',
  });

export type EvidenceMatch = z.infer<typeof EvidenceMatchSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
export type BlockchainForensics = z.infer<typeof BlockchainForensicsSchema>;
export type ExifForensics = z.infer<typeof ExifForensicsSchema>;
export type ReverseImageForensics = z.infer<typeof ReverseImageForensicsSchema>;
export type IdentityForensics = z.infer<typeof IdentityForensicsSchema>;
export type Forensics = z.infer<typeof ForensicsSchema>;

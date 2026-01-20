import { z } from '@hono/zod-openapi';
import { MediaItemSchema } from './common';

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

export type AssessInput = z.infer<typeof AssessSchema>;
export type InvestigateInput = z.infer<typeof InvestigateSchema>;
export type InvestigateStatusInput = z.infer<typeof InvestigateStatusSchema>;

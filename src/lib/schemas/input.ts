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
      .max(10)
      .default([])
      .openapi({
        description: 'Array of media files from Supabase Storage (max 10)',
        example: [
          { path: 'campaigns/123/medical_report.jpg', type: 'image' },
          { path: 'campaigns/123/hospital_video.mp4', type: 'video' },
        ],
      }),
    creatorAddress: z.string().optional().openapi({
      description:
        'Ethereum wallet address of the campaign creator (for blockchain forensics)',
      example: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d6b8',
    }),
    donors: z
      .array(z.string())
      .max(50)
      .optional()
      .openapi({
        description:
          'Array of donor wallet addresses for wash trading detection (max 50)',
        example: ['0xabc...', '0xdef...'],
      }),
    creator: z
      .object({
        fullName: z.string().min(2).openapi({
          description: 'Full name of campaign creator',
          example: 'John Doe',
        }),
        username: z.string().min(3).openapi({
          description: 'Username/handle of campaign creator',
          example: 'johndoe123',
        }),
        email: z.string().email().openapi({
          description: 'Email address of campaign creator',
          example: 'john@example.com',
        }),
      })
      .optional()
      .openapi({
        description: 'Creator identity for OSINT investigation',
      }),
  })
  .openapi({
    title: 'AssessInput',
    description: 'Input payload for fraud assessment',
  });

export type AssessInput = z.infer<typeof AssessSchema>;

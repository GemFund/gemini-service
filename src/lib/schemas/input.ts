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
    description: 'Input payload for fraud assessment',
  });

export type AssessInput = z.infer<typeof AssessSchema>;

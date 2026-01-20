import { z } from '@hono/zod-openapi';

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

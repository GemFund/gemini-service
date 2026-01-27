import { createRoute } from '@hono/zod-openapi';
import {
  AssessSchema,
  AssessResponseSchema,
  ErrorResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from './schemas';

export const assessRoute = createRoute({
  method: 'post',
  path: '/api/v1/assess',
  tags: ['Fraud Assessment'],
  summary: 'Assess a fundraising campaign for fraud indicators',
  description: `
Performs rapid forensic analysis of a fundraising campaign using Gemini AI.

**Analysis includes:**
- Visual consistency checks (deepfakes, stock photos, medical equipment)
- Narrative logic verification (hospital names, costs, currency)
- Sentiment manipulation detection (urgency traps, emotional blackmail)
- Google Search grounding for fact-checking

**Media Handling:**
- Media paths are resolved to public Supabase Storage URLs
- URLs are passed directly to Gemini AI for visual analysis
- Supports: JPEG, PNG, WebP, GIF, MP4, WebM, MOV

**Response Time:** 5-15 seconds depending on media count
  `,
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AssessSchema,
        },
      },
      required: true,
      description:
        'Campaign text and optional media paths from Supabase Storage bucket',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AssessResponseSchema,
        },
      },
      description: 'Assessment completed successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: 'Validation error - invalid request body',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
      description: 'Unauthorized - missing or invalid JWT token',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

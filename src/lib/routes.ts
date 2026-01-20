import { createRoute } from '@hono/zod-openapi';
import {
  AssessSchema,
  AssessResponseSchema,
  InvestigateSchema,
  InvestigateInitResponseSchema,
  InvestigateStatusSchema,
  InvestigateStatusResponseSchema,
  ErrorResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from './types';

export const assessRoute = createRoute({
  method: 'post',
  path: '/api/v1/assess',
  tags: ['Tier 1 - Rapid Assessment'],
  summary: 'Assess a fundraising campaign for fraud indicators',
  description: `
Performs rapid forensic analysis of a fundraising campaign using Gemini AI.

**Analysis includes:**
- Visual consistency checks (deepfakes, stock photos, medical equipment)
- EXIF metadata forensics (GPS, timestamps, camera info, editing software)
- Narrative logic verification (hospital names, costs, currency)
- Sentiment manipulation detection (urgency traps, emotional blackmail)
- Google Search grounding for fact-checking

**Media Support:**
- Images: JPEG, PNG, WebP (EXIF metadata extracted)
- Videos: MP4, WebM (processed async, may take longer)

**Response Time:** 5-30 seconds depending on media count
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
        'Campaign text and optional media files from Supabase Storage',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AssessResponseSchema,
        },
      },
      description:
        'Assessment completed successfully. Contains credibility score (0-100), verdict, and detailed analysis.',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description:
        'Validation error - invalid request body or missing required fields',
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
      description:
        'Internal server error - AI processing failed or Supabase download error',
    },
  },
});

export const investigateRoute = createRoute({
  method: 'post',
  path: '/api/v1/investigate',
  tags: ['Tier 2 - Deep Investigation'],
  summary: 'Start a deep investigation on a charity or campaign',
  description: `
Initiates an asynchronous deep research investigation using Gemini AI agents with Google Search grounding.

**Investigation includes:**
- Official charity registration verification (IRS 501(c)(3), etc.)
- Scam/fraud report searches across multiple databases
- Financial transparency analysis (Form 990, annual reports)
- News and social media sentiment analysis
- Cost verification against market rates

**Important:** This endpoint returns immediately with an \`interaction_id\`. 
Use \`/api/v1/investigate/status\` to poll for results.

**Processing Time:** 30 seconds to 2 minutes depending on research depth
  `,
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: InvestigateSchema,
        },
      },
      required: true,
      description: 'Charity name and claim context for targeted investigation',
    },
  },
  responses: {
    202: {
      content: {
        'application/json': {
          schema: InvestigateInitResponseSchema,
        },
      },
      description:
        'Investigation started successfully. Poll `/api/v1/investigate/status` with the returned `interaction_id` to get results.',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: 'Validation error - charity_name or claim_context invalid',
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
      description: 'Internal server error - failed to start investigation',
    },
  },
});

export const investigateStatusRoute = createRoute({
  method: 'post',
  path: '/api/v1/investigate/status',
  tags: ['Tier 2 - Deep Investigation'],
  summary: 'Check the status of a deep investigation',
  description: `
Polls the status of an ongoing investigation started via \`/api/v1/investigate\`.

**Status Values:**
- \`processing\` - Investigation still in progress (HTTP 202)
- \`completed\` - Results ready in \`data\` field (HTTP 200)
- \`failed\` - Investigation failed (HTTP 200)

**Polling Strategy:**
- Poll every 5 seconds
- Timeout after 2 minutes
- On \`completed\`, the \`data\` field contains the full structured report
  `,
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: InvestigateStatusSchema,
        },
      },
      required: true,
      description: 'The interaction_id received from /api/v1/investigate',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description:
        'Investigation completed or failed. Check `status` field. If `completed`, full report is in `data` field.',
    },
    202: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description: 'Investigation still in progress. Continue polling.',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: 'Validation error - invalid interaction_id',
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
      description: 'Internal server error - failed to check status',
    },
  },
});

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
} from './schemas';

export const assessRoute = createRoute({
  method: 'post',
  path: '/api/v1/assess',
  tags: ['Tier 1 - Rapid Assessment'],
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

export const investigateRoute = createRoute({
  method: 'post',
  path: '/api/v1/investigate',
  tags: ['Tier 2 - Deep Investigation'],
  summary: 'Start a deep investigation on a charity or campaign',
  description: `
Initiates an asynchronous deep research investigation using Gemini AI agents.

**Investigation includes:**
- Official charity registration verification
- Scam/fraud report searches
- Financial transparency analysis
- News and social media sentiment analysis
- Cost verification against market rates

**Important:** Returns immediately with an \`interaction_id\`. 
Use \`/api/v1/investigate/status\` to poll for results.

**Processing Time:** 30 seconds to 10 minutes
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
      description: 'Charity name and claim context',
    },
  },
  responses: {
    202: {
      content: {
        'application/json': {
          schema: InvestigateInitResponseSchema,
        },
      },
      description: 'Investigation started - poll status endpoint for results',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: 'Validation error',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
      description: 'Unauthorized',
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

export const investigateStatusRoute = createRoute({
  method: 'post',
  path: '/api/v1/investigate/status',
  tags: ['Tier 2 - Deep Investigation'],
  summary: 'Check the status of a deep investigation',
  description: `
Polls the status of an ongoing investigation.

**Status Values:**
- \`processing\` - Investigation in progress (HTTP 202)
- \`completed\` - Results ready (HTTP 200)
- \`failed\` - Investigation failed (HTTP 200)

**Polling Strategy:** Poll every 5 seconds, timeout after 10 minutes
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
      description: 'The interaction_id from /api/v1/investigate',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description: 'Investigation completed or failed',
    },
    202: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description: 'Investigation in progress',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: 'Validation error',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
      description: 'Unauthorized',
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

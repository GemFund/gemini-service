import { createRoute } from '@hono/zod-openapi';
import {
  AssessSchema,
  AssessResponseSchema,
  InvestigateSchema,
  InvestigateInitResponseSchema,
  InvestigateStatusSchema,
  InvestigateStatusResponseSchema,
  ErrorResponseSchema,
} from './types';

export const assessRoute = createRoute({
  method: 'post',
  path: '/api/v1/assess',
  tags: ['Tier 1 - Rapid Assessment'],
  summary: 'Assess a fundraising campaign for fraud indicators',
  description:
    'Performs rapid forensic analysis of a fundraising campaign using AI. Analyzes claim text, visual evidence, and EXIF metadata to detect fraud patterns.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: AssessSchema,
        },
      },
      required: true,
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
  description:
    'Initiates an asynchronous deep research investigation using AI agents. Returns immediately with an interaction ID for polling.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: InvestigateSchema,
        },
      },
      required: true,
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
  description:
    'Polls the status of an ongoing investigation. When complete, returns a structured report with findings.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: InvestigateStatusSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description: 'Investigation completed with results',
    },
    202: {
      content: {
        'application/json': {
          schema: InvestigateStatusResponseSchema,
        },
      },
      description: 'Investigation still in progress',
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

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
  tags: ['Assessment'],
  summary: 'Analyze campaign for fraud indicators',
  description: `
Comprehensive fraud analysis combining:

**Hard Metrics (Objective, 70% weight):**
- Blockchain forensics via Etherscan (wallet age, nonce, wash trading)
- Reverse image search via SerpAPI (stock photos, stolen imagery)
- EXIF metadata extraction (timestamps, GPS, editing software)
- Identity OSINT via Google Search (social presence, scam reports)

**Identity OSINT Investigation:**
- Social media presence analysis (Twitter, LinkedIn, GitHub, Instagram)
- Scam/fraud report searches (ripoffreport, scamadviser)
- Disposable email detection
- Cross-platform identity consistency
- Account age and digital footprint depth

**Soft Metrics (AI-Analyzed, 30% weight):**
- Visual consistency with campaign claims
- Narrative logic and fact-checking via Google Search
- Urgency/manipulation detection

**Critical Fraud Indicators:**
- Wash trading score >20% → FRAUD
- Burner wallet (age <24h + nonce <5) → HIGH RISK
- Stock photo detected → FRAUD
- Scam reports found → HIGH RISK
- Disposable email → SUSPICIOUS

**Response Time:** 15-45 seconds (includes OSINT investigation)
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
      description: 'Invalid request body',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedResponseSchema,
        },
      },
      description: 'Missing or invalid JWT token',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Server error during analysis',
    },
  },
});

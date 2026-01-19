import { factory } from './lib/factory';
import { zValidator } from '@hono/zod-validator';
import {
  AssessSchema,
  InvestigateSchema,
  InvestigateStatusSchema,
} from './lib/types';
import type {
  Tier1Response,
  InvestigateInitResponse,
  InvestigateStatusResponse,
} from './lib/types';

interface AssessResponse {
  success: boolean;
  tier: 1;
  data: Tier1Response;
  deep_investigation: 'RECOMMENDED' | 'OPTIONAL';
}

interface ErrorResponse {
  success: false;
  error: string;
}

export const verifyCampaign = factory.createHandlers(
  zValidator('json', AssessSchema),
  async (c): Promise<Response> => {
    const { text, media } = c.req.valid('json');

    try {
      const result = await c.var.services.gemini.assessTier1(text, media);

      const recommendation = result.score < 50 ? 'RECOMMENDED' : 'OPTIONAL';

      const response: AssessResponse = {
        success: true,
        tier: 1,
        data: result,
        deep_investigation: recommendation,
      };

      return c.json(response);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error occurred';
      const response: ErrorResponse = { success: false, error };
      return c.json(response, 500);
    }
  },
);

export const startInvestigationHandler = factory.createHandlers(
  zValidator('json', InvestigateSchema),
  async (c): Promise<Response> => {
    const { charity_name, claim_context } = c.req.valid('json');

    try {
      const result = await c.var.services.gemini.startInvestigation(
        charity_name,
        claim_context,
      );

      const response: InvestigateInitResponse = {
        success: true,
        interaction_id: result.interactionId,
        status: result.status,
        message:
          'Investigation started. Poll the status endpoint to check progress.',
      };

      return c.json(response, 202);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error occurred';
      const response: ErrorResponse = { success: false, error };
      return c.json(response, 500);
    }
  },
);

export const getInvestigationStatusHandler = factory.createHandlers(
  zValidator('json', InvestigateStatusSchema),
  async (c): Promise<Response> => {
    const { interaction_id } = c.req.valid('json');

    try {
      const statusResult =
        await c.var.services.gemini.getInvestigationStatus(interaction_id);

      if (statusResult.status === 'completed' && statusResult.rawOutput) {
        const formattedReport =
          await c.var.services.gemini.formatInvestigationReport(
            statusResult.rawOutput,
          );

        const response: InvestigateStatusResponse = {
          success: true,
          interaction_id,
          status: 'completed',
          data: formattedReport,
          raw_output: statusResult.rawOutput,
        };

        return c.json(response);
      }

      if (statusResult.status === 'failed') {
        const response: InvestigateStatusResponse = {
          success: true,
          interaction_id,
          status: 'failed',
        };

        return c.json(response);
      }

      const response: InvestigateStatusResponse = {
        success: true,
        interaction_id,
        status: 'processing',
      };

      return c.json(response, 202);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error occurred';
      const response: ErrorResponse = { success: false, error };
      return c.json(response, 500);
    }
  },
);

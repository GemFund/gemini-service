import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import type { AppType } from './lib/types';
import { verifyToken } from './middlewares/auth';
import { initServices } from './middlewares/init';
import {
  assessRoute,
  investigateRoute,
  investigateStatusRoute,
} from './lib/routes';

const app = new OpenAPIHono<AppType>();

app.use('*', initServices);
app.use('*', cors({ origin: '*' }));

app.get('/', (c) => c.text('GemFund Forensic Engine Online'));

app.use('/api/*', verifyToken);

app.openapi(assessRoute, async (c) => {
  const { text, media } = c.req.valid('json');

  try {
    const result = await c.var.services.gemini.assessTier1(text, media);
    const recommendation: 'RECOMMENDED' | 'OPTIONAL' =
      result.score < 50 ? 'RECOMMENDED' : 'OPTIONAL';

    return c.json(
      {
        success: true as const,
        tier: 1 as const,
        data: result,
        deep_investigation: recommendation,
      },
      200,
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error occurred';
    return c.json({ success: false as const, error }, 500);
  }
});

app.openapi(investigateRoute, async (c) => {
  const { charity_name, claim_context } = c.req.valid('json');

  try {
    const result = await c.var.services.gemini.startInvestigation(
      charity_name,
      claim_context,
    );

    return c.json(
      {
        success: true as const,
        interaction_id: result.interactionId,
        status: result.status as
          | 'pending'
          | 'processing'
          | 'completed'
          | 'failed',
        message:
          'Investigation started. Poll the status endpoint to check progress.',
      },
      202,
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error occurred';
    return c.json({ success: false as const, error }, 500);
  }
});

app.openapi(investigateStatusRoute, async (c) => {
  const { interaction_id } = c.req.valid('json');

  try {
    const statusResult =
      await c.var.services.gemini.getInvestigationStatus(interaction_id);

    if (statusResult.status === 'completed' && statusResult.rawOutput) {
      const formattedReport =
        await c.var.services.gemini.formatInvestigationReport(
          statusResult.rawOutput,
        );

      return c.json(
        {
          success: true as const,
          interaction_id,
          status: 'completed' as const,
          data: formattedReport,
          raw_output: statusResult.rawOutput,
        },
        200,
      );
    }

    if (statusResult.status === 'failed') {
      return c.json(
        {
          success: true as const,
          interaction_id,
          status: 'failed' as const,
        },
        200,
      );
    }

    return c.json(
      {
        success: true as const,
        interaction_id,
        status: 'processing' as const,
      },
      202,
    );
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error occurred';
    return c.json({ success: false as const, error }, 500);
  }
});

app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'GemFund Forensic Engine API',
    version: '1.0.0',
    description:
      'AI-powered charity fraud detection service. Uses Gemini AI to analyze fundraising campaigns for authenticity.',
  },
  servers: [
    {
      url: 'https://gemfund-gemini-service.echa-apriliyanto-dev.workers.dev',
      description: 'Production',
    },
    { url: 'http://localhost:8787', description: 'Local development' },
  ],
});

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase JWT token',
});

app.get(
  '/docs',
  Scalar({
    url: '/doc',
    theme: 'purple',
    pageTitle: 'GemFund Forensic Engine API',
  }),
);

export default app;

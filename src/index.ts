import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppType } from './lib/types';
import { verifyToken } from './middlewares/auth';
import { initServices } from './middlewares/init';
import { verifyCampaign } from './handlers';

const app = new Hono<AppType>();

app.use('*', initServices);
app.use('*', cors({ origin: '*' }));

app.post('/api/v1/assess', verifyToken, ...verifyCampaign);

export default app;

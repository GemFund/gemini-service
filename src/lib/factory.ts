import type { AppType } from './types';
import { createFactory } from 'hono/factory';

export const factory = createFactory<AppType>();

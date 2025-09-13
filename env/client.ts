// https://env.t3.gg/docs/nextjs#create-your-schema
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1).url().optional().default('https://onco.bot'),
    NEXT_PUBLIC_API_URL: z.string().min(1).url().optional().default('https://api.onco.bot'),
    
    // Analytics - optional but recommended
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    
    // Legacy search engine - optional (not used in eligibility funnel)
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
});

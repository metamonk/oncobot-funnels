// https://env.t3.gg/docs/nextjs#create-your-schema
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnv = createEnv({
  server: {
    // Core required for eligibility funnel
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().optional(),
    
    // OAuth - optional but recommended
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    
    // AI Services - optional (at least one recommended)
    OPENAI_API_KEY: z.string().optional(),
    XAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    
    // Legacy search engine APIs - optional (not used in eligibility funnel)
    DAYTONA_API_KEY: z.string().optional(),
    REDIS_URL: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    EXA_API_KEY: z.string().optional(),
    TMDB_API_KEY: z.string().optional(),
    YT_ENDPOINT: z.string().optional(),
    FIRECRAWL_API_KEY: z.string().optional(),
    OPENWEATHER_API_KEY: z.string().optional(),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
    MAPBOX_ACCESS_TOKEN: z.string().optional(),
    AMADEUS_API_KEY: z.string().optional(),
    AMADEUS_API_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    MEM0_API_KEY: z.string().optional(),
    MEM0_ORG_ID: z.string().optional(),
    MEM0_PROJECT_ID: z.string().optional(),
    SMITHERY_API_KEY: z.string().optional(),
    COINGECKO_API_KEY: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),
  },
  experimental__runtimeEnv: process.env,
});

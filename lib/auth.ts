import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import {
  user,
  session,
  verification,
  account,
  chat,
  message,
  customInstructions,
  stream,
  healthProfile,
  userHealthProfile,
  healthProfileResponse,
} from '@/lib/db/schema';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { config } from 'dotenv';
import { serverEnv } from '@/env/server';
import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { eq } from 'drizzle-orm';

config({
  path: '.env.local',
});

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  ...(process.env.NODE_ENV === 'production' ? {} : { server: 'sandbox' }),
});

export const auth = betterAuth({
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      verification,
      account,
      chat,
      message,
      customInstructions,
      stream,
      healthProfile,
      userHealthProfile,
      healthProfileResponse,
    },
  }),
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    },
    twitter: {
      clientId: serverEnv.TWITTER_CLIENT_ID,
      clientSecret: serverEnv.TWITTER_CLIENT_SECRET,
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
      getCustomerCreateParams: async ({ user: newUser }) => {
        console.log('🚀 getCustomerCreateParams called for user:', newUser.id);

        try {
          // Look for existing customer by email
          const { result: existingCustomers } = await polarClient.customers.list({
            email: newUser.email,
          });

          const existingCustomer = existingCustomers.items[0];

          if (existingCustomer && existingCustomer.externalId && existingCustomer.externalId !== newUser.id) {
            console.log(
              `🔗 Found existing customer ${existingCustomer.id} with external ID ${existingCustomer.externalId}`,
            );
            console.log(`🔄 Updating user ID from ${newUser.id} to ${existingCustomer.externalId}`);

            // Update the user's ID in database to match the existing external ID
            await db.update(user).set({ id: existingCustomer.externalId }).where(eq(user.id, newUser.id));

            console.log(`✅ Updated user ID to match existing external ID: ${existingCustomer.externalId}`);
          }

          return {};
        } catch (error) {
          console.error('💥 Error in getCustomerCreateParams:', error);
          return {};
        }
      },
      use: [
        checkout({
          products: [
            {
              productId:
                process.env.NEXT_PUBLIC_STARTER_TIER ||
                (() => {
                  throw new Error('NEXT_PUBLIC_STARTER_TIER environment variable is required');
                })(),
              slug:
                process.env.NEXT_PUBLIC_STARTER_SLUG ||
                (() => {
                  throw new Error('NEXT_PUBLIC_STARTER_SLUG environment variable is required');
                })(),
            },
          ],
          successUrl: `/success`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret:
            process.env.POLAR_WEBHOOK_SECRET ||
            (() => {
              throw new Error('POLAR_WEBHOOK_SECRET environment variable is required');
            })(),
          onPayload: async ({ type }) => {
            // Subscription webhooks are no longer processed since we removed subscriptions
            console.log('Received webhook:', type);
          },
        }),
      ],
    }),
    nextCookies(),
  ],
  trustedOrigins: ['http://localhost:3000', 'https://oncobot-v3.vercel.app', 'https://onco.bot', 'https://www.onco.bot'],
  allowedOrigins: ['http://localhost:3000', 'https://oncobot-v3.vercel.app', 'https://onco.bot', 'https://www.onco.bot'],
});

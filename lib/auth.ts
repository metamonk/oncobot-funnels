import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
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
import { serverEnv } from '@/env/server';
import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { MagicLinkEmail } from '@/lib/email/templates/magic-link';

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || 'placeholder-token',
  ...(process.env.NODE_ENV === 'production' ? {} : { server: 'sandbox' }),
});

const resend = new Resend(serverEnv.RESEND_API_KEY);

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
  emailAndPassword: {
    enabled: false, // We're using magic link instead
  },
  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID || '',
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET || '',
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        try {
          // Determine the from address
          // Use EMAIL_FROM if set and domain is verified, otherwise use Resend's test domain
          const fromAddress = serverEnv.EMAIL_FROM || 'oncobot <onboarding@resend.dev>';
          
          // Log the email details for debugging
          console.log('📧 Attempting to send magic link email:', {
            from: fromAddress,
            to: email,
            hasResendKey: !!serverEnv.RESEND_API_KEY,
            keyPrefix: serverEnv.RESEND_API_KEY?.substring(0, 10) + '...',
          });

          // Send email using Resend
          const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: 'Sign in to oncobot',
            react: MagicLinkEmail({ magicLink: url, email }),
          });

          if (error) {
            console.error('❌ Resend error:', error);
            // If the error is about domain verification, provide helpful message
            if (error.message?.includes('domain') || error.message?.includes('verify')) {
              console.error('💡 Tip: Make sure your domain is verified in Resend dashboard or use "onboarding@resend.dev" for testing');
            }
            throw new Error(`Failed to send magic link email: ${error.message || JSON.stringify(error)}`);
          }

          console.log('✅ Magic link email sent successfully:', data);
        } catch (err) {
          console.error('❌ Error in sendMagicLink:', err);
          // Provide more helpful error messages
          if (err instanceof Error) {
            if (err.message.includes('401')) {
              throw new Error('Invalid Resend API key. Please check your RESEND_API_KEY environment variable.');
            }
            if (err.message.includes('403')) {
              throw new Error('Domain not verified in Resend. Please verify your domain or use "onboarding@resend.dev" for testing.');
            }
          }
          throw err;
        }
      },
      expiresIn: 60 * 10, // 10 minutes
    }),
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
              productId: process.env.NEXT_PUBLIC_STARTER_TIER || 'placeholder-tier',
              slug: process.env.NEXT_PUBLIC_STARTER_SLUG || 'starter',
            },
          ],
          successUrl: `/success`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || 'placeholder-webhook-secret',
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

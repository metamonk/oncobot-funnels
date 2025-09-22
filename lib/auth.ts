import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import {
  user,
  session,
  verification,
  account,
} from '@/lib/db/schema';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { serverEnv } from '@/env/server';
import { Resend } from 'resend';
import { MagicLinkEmail } from '@/lib/email/templates/magic-link';

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
          // Use the configured EMAIL_FROM which should have a verified domain
          // Fallback to Resend's test domain if not configured
          const fromAddress = serverEnv.EMAIL_FROM || 'OncoBot <onboarding@resend.dev>';
          
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
              console.error('📌 Note: You can still sign in with Google OAuth while email is being configured');
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
    nextCookies(),
  ],
  trustedOrigins: ['http://localhost:3000', 'https://oncobot-v3.vercel.app', 'https://onco.bot', 'https://www.onco.bot'],
  allowedOrigins: ['http://localhost:3000', 'https://oncobot-v3.vercel.app', 'https://onco.bot', 'https://www.onco.bot'],
});

zeno@Mac oncobot-funnels % pnpm dev

> oncobot@0.1.0 dev /Users/zeno/Projects/oncobot-funnels
> next dev --turbopack

   ▲ Next.js 15.4.2 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.166:3000
   - Environments: .env
   - Experiments (use with caution):
     ✓ useCache
     · staleTimes
     · serverActions
     · ...

 ✓ Starting...
 ✓ Compiled middleware in 80ms
 ✓ Ready in 825ms
(node:20082) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 ○ Compiling /admin/login ...
 ✓ Compiled /admin/login in 2.4s
[Feature Toggle] All modes enabled
 GET /admin/login 200 in 2674ms
 ✓ Compiled /manifest.webmanifest in 153ms
 GET /manifest.webmanifest 200 in 192ms
 ✓ Compiled /apple-icon.png in 63ms
 GET /favicon.ico 200 in 411ms
 GET /apple-icon.png 200 in 285ms
 ○ Compiling /api/auth/[...all] ...
 ✓ Compiled /api/auth/[...all] in 636ms
📧 Attempting to send magic link email: {
  from: 'OncoBot <noreply@onco.bot>',
  to: 'zeno@gerund.co',
  hasResendKey: true,
  keyPrefix: 're_2kGx1n6...'
}
❌ Resend error: {
  statusCode: 403,
  message: 'The onco.bot domain is not verified. Please, add and verify your domain on https://resend.com/domains',
  name: 'validation_error'
}
💡 Tip: Make sure your domain is verified in Resend dashboard or use "onboarding@resend.dev" for testing
📌 Note: You can still sign in with Google OAuth while email is being configured
❌ Error in sendMagicLink: Error: Failed to send magic link email: The onco.bot domain is not verified. Please, add and verify your domain on https://resend.com/domains
    at Object.sendMagicLink (lib/auth.ts:72:18)
  70 |               console.error('📌 Note: You can still sign in with Google OAuth while email is being configured');
  71 |             }
> 72 |             throw new Error(`Failed to send magic link email: ${error.message || JSON.stringify(error)}`);
     |                  ^
  73 |           }
  74 |
  75 |           console.log('✅ Magic link email sent successfully:', data);
# SERVER_ERROR:  Error: Failed to send magic link email: The onco.bot domain is not verified. Please, add and verify your domain on https://resend.com/domains
    at Object.sendMagicLink (lib/auth.ts:72:18)
  70 |               console.error('📌 Note: You can still sign in with Google OAuth while email is being configured');
  71 |             }
> 72 |             throw new Error(`Failed to send magic link email: ${error.message || JSON.stringify(error)}`);
     |                  ^
  73 |           }
  74 |
  75 |           console.log('✅ Magic link email sent successfully:', data);
 POST /api/auth/sign-in/magic-link 500 in 3141ms
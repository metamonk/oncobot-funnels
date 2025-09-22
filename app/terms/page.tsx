'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { OncoBotLogo } from '@/components/logos/oncobot-logo';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/30 to-transparent dark:from-neutral-950/30 dark:to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />

        <div className="relative pt-24 pb-12 px-4">
          <motion.div
            className="container max-w-3xl mx-auto space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Logo */}
            <motion.div variants={item} className="text-center">
              <Link href="/" className="inline-flex items-center gap-3 font-be-vietnam-pro font-bold">
                <div className="relative w-14 h-14 rounded-full bg-white/90 dark:bg-black/90 shadow-sm flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
                  <OncoBotLogo 
                    size="sm"
                    variant="default"
                    className="opacity-90 text-foreground dark:text-gray-200"
                  />
                </div>
              </Link>
            </motion.div>

            <motion.div variants={item} className="text-center">
              <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-3">
                Last updated: August 18, 2025
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 px-4">
        <div className="container max-w-3xl mx-auto prose dark:prose-invert prose-neutral prose-headings:font-be-vietnam-pro prose-p:text-neutral-600 dark:prose-p:text-neutral-400 prose-a:text-neutral-900 dark:prose-a:text-neutral-200 prose-a:no-underline hover:prose-a:text-black dark:hover:prose-a:text-white prose-headings:tracking-tight">
          <p className="text-lg">
            Welcome to OncoBot, a medical oncology AI assistant. These Terms of Service govern your use of our platform
            and services. By using OncoBot, you agree to these terms in full. If you disagree with any part of these
            terms, please do not use our service. <strong>OncoBot is designed to assist healthcare professionals and
            should not be used as a substitute for professional medical judgment.</strong>
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Oncobot, you acknowledge that you have read, understood, and agree to be bound by
            these Terms of Service. We reserve the right to modify these terms at any time, and such modifications shall
            be effective immediately upon posting. Your continued use of Oncobot after any modifications indicates your
            acceptance of the modified terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            OncoBot is an AI-powered medical oncology assistant that helps healthcare professionals access clinical trial
            information, treatment guidelines, and oncology research. Our service utilizes artificial intelligence to
            process medical queries and provide evidence-based information from reputable medical sources.
          </p>
          <p>
            Our service includes features such as clinical trial matching, health profile creation, treatment information
            retrieval, and access to current oncology guidelines. We integrate with various AI technology providers and
            medical databases to deliver comprehensive oncology information.
          </p>

          <h2>3. User Conduct</h2>
          <p>You agree not to use OncoBot to:</p>
          <ul>
            <li>Engage in any activity that violates applicable laws or regulations</li>
            <li>Infringe upon the rights of others, including intellectual property rights</li>
            <li>Distribute malware, viruses, or other harmful computer code</li>
            <li>Attempt to gain unauthorized access to our systems or networks</li>
            <li>Conduct automated queries or scrape our service</li>
            <li>Generate or distribute illegal, harmful, or offensive content</li>
            <li>Interfere with the proper functioning of the service</li>
          </ul>

          <h2>4. Medical Disclaimer</h2>
          <p><strong>IMPORTANT: OncoBot is not a substitute for professional medical advice, diagnosis, or treatment.</strong></p>
          <ul>
            <li>Always seek the advice of qualified healthcare providers with any questions regarding medical conditions</li>
            <li>Never disregard professional medical advice or delay seeking it because of information from OncoBot</li>
            <li>OncoBot is designed as an informational tool for healthcare professionals, not for patient self-diagnosis</li>
            <li>Clinical decisions should be based on professional judgment and complete patient evaluation</li>
            <li>Information provided may not be exhaustive or reflect the most recent medical developments</li>
          </ul>
          <p>
            While we strive to provide accurate medical information from reputable sources, OncoBot does not guarantee
            the accuracy, completeness, or timeliness of any medical information. Users must verify all information
            independently before making clinical decisions.
          </p>

          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of OncoBot, including but not limited to text, graphics, logos,
            icons, images, audio clips, and software, are the property of OncoBot or its licensors and are protected by
            copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You may not copy, modify, distribute, sell, or lease any part of our service or included software without
            explicit permission.
          </p>

          <h2>6. Third-Party Services and AI Technology</h2>
          <p>OncoBot relies on third-party services to provide its functionality:</p>
          <ul>
            <li>Our service is hosted on Vercel&apos;s infrastructure</li>
            <li>We integrate with AI technology providers including OpenAI, Anthropic, xAI, Google, Groq, and Mistral</li>
            <li>These third-party services have their own terms of service and privacy policies</li>
            <li>We are not responsible for the practices or policies of these third-party services</li>
          </ul>
          <p>
            By using OncoBot, you acknowledge and agree that your data may be processed by these third-party services
            as described in our Privacy Policy. Please note that:
          </p>
          <ul>
            <li>AI responses may contain inaccuracies and should be verified independently</li>
            <li>We do not send health profile data to AI providers</li>
            <li>Only anonymized queries are processed by AI services</li>
            <li>AI providers do not retain your data beyond processing</li>
          </ul>

          <h2>7. User Accounts and Authentication</h2>
          <p>
            OncoBot requires user authentication to access its services. By creating an account, you agree to:
          </p>
          <ul>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
            <li>Use the service only for lawful medical and research purposes</li>
          </ul>

          <h2>8. Health Information and Data</h2>
          <p>
            When using OncoBot&apos;s health profile and clinical trial matching features:
          </p>
          <ul>
            <li>You may input health-related information for clinical trial matching purposes</li>
            <li>All health data is handled in accordance with our Privacy Policy</li>
            <li>You are responsible for obtaining appropriate consent before entering any patient data</li>
            <li>Health profiles should only be created by or with the consent of the individual</li>
            <li>We do not provide medical advice based on health profile information</li>
          </ul>

          <h2>9. Privacy and Health Data</h2>
          <p>
            Your use of OncoBot is also governed by our{' '}
            <Link href="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms of Service by reference. Key privacy commitments include:
          </p>
          <ul>
            <li>We never sell your data to third parties</li>
            <li>Health profiles are encrypted and automatically deleted after 90 days of inactivity</li>
            <li>We respect Do Not Track browser settings</li>
            <li>You can delete your account and all associated data at any time</li>
            <li>We use privacy-focused analytics that don&apos;t track individual users</li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, OncoBot shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in
            connection with your use of or inability to use the service.
          </p>

          <h2>11. Disclaimers</h2>
          <p>
            OncoBot is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind,
            either express or implied, including but not limited to warranties of merchantability, fitness for a
            particular purpose, or non-infringement.
          </p>

          <h2>12. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to OncoBot, with or without notice, for conduct
            that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for
            any other reason at our discretion.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
            OncoBot operates, without regard to its conflict of law provisions.
          </p>

          <h2>14. Medical Disclaimer</h2>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Important Medical Notice</h3>
            <p className="text-yellow-800 dark:text-yellow-200 mb-4">
              <strong>OncoBot is NOT a substitute for professional medical advice, diagnosis, or treatment.</strong>
            </p>
            <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
              <li>• This service provides information about clinical trials for educational purposes only</li>
              <li>• Always consult with qualified healthcare professionals before making medical decisions</li>
              <li>• Never delay seeking medical advice because of information obtained from this service</li>
              <li>• Clinical trial eligibility determinations are preliminary and must be confirmed by trial sites</li>
              <li>• Individual results and experiences may vary significantly</li>
              <li>• We do not recommend or endorse any specific trials, treatments, or medical facilities</li>
            </ul>
            <p className="mt-4 text-yellow-800 dark:text-yellow-200">
              <strong>In case of a medical emergency, call 911 or your local emergency services immediately.</strong>
            </p>
          </div>

          <h2>15. Contact Us</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
          <p>
            <a href="mailto:hi@onco.bot" className="flex items-center gap-1">
              hi@onco.bot <ExternalLink className="h-4 w-4" />
            </a>
          </p>

          <div className="my-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              By using OncoBot, you agree to these Terms of Service and our{' '}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 mt-10">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />
        <div className="container max-w-3xl mx-auto px-4 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                <OncoBotLogo 
                  size="xs"
                  variant="default"
                  className="opacity-80 text-foreground dark:text-gray-200"
                />
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                © {new Date().getFullYear()} OncoBot
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Home
              </Link>
              <Link href="/about" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                About
              </Link>
              <Link href="/terms" className="text-neutral-900 dark:text-neutral-100 font-medium">
                Terms
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

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

export default function PrivacyPage() {
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
              <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
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
            At OncoBot, we respect your privacy and are committed to protecting your personal and health-related data.
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our medical
            oncology AI assistant. We understand the sensitive nature of health information and maintain strict
            confidentiality standards.
          </p>

          <h2>Our Commitment to Privacy</h2>
          <p>
            OncoBot is designed with privacy at its core. We collect only the data necessary to provide and improve our
            clinical trial search services. <strong>We never sell your data to third parties</strong>, and we never use
            your health information for advertising.
          </p>

          <h2>Information We Collect</h2>
          
          <h3>1. Usage Analytics</h3>
          <p>We use privacy-focused analytics to understand how our service is used:</p>
          <ul>
            <li>Page views and navigation patterns (which pages you visit)</li>
            <li>Search queries for clinical trials (not linked to your identity)</li>
            <li>Interaction events (buttons clicked, features used)</li>
            <li>Device information (browser type, operating system, screen size)</li>
            <li>General location (country and state only, never precise location)</li>
            <li>Session quality metrics (time spent, engagement scores)</li>
          </ul>
          <p>
            <strong>We DO NOT collect:</strong> Your name or email (unless you provide it), IP addresses, precise
            location data, or any cross-site tracking information.
          </p>

          <h3>2. Clinical Trial Interactions</h3>
          <p>To improve our matching and recommendation system, we track:</p>
          <ul>
            <li>Which clinical trials you view (anonymized)</li>
            <li>Trial match scores and ranking positions</li>
            <li>When you click contact information or external links</li>
            <li>When you expand eligibility criteria</li>
            <li>Search filters and keywords used</li>
          </ul>

          <h3>3. Optional Health Profile</h3>
          <p>If you choose to create a health profile for personalized trial matching:</p>
          <ul>
            <li><strong>What we store:</strong> General cancer type and region, disease stage category, treatment
              history (surgery, chemo, radiation, immunotherapy), performance status, general molecular marker status</li>
            <li><strong>What we DON&apos;T store:</strong> Your name, contact information, specific medical record numbers,
              detailed clinical notes, or physician information</li>
            <li><strong>Your control:</strong> You can skip the profile entirely, abandon it at any point, delete your
              profile data at any time, or update information when your situation changes</li>
          </ul>

          <h3>4. Account Information</h3>
          <p>If you create an account:</p>
          <ul>
            <li>Email address for authentication</li>
            <li>Authentication tokens for secure access</li>
            <li>Account preferences and settings</li>
          </ul>

          <h3>5. Performance Metrics</h3>
          <p>We monitor technical performance to ensure a smooth experience:</p>
          <ul>
            <li>Core Web Vitals (page load speed, interactivity, visual stability)</li>
            <li>Search response times and API performance</li>
            <li>Error occurrences (not personal details)</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide medical oncology information and clinical trial matching</li>
            <li>To improve the accuracy and relevance of search results</li>
            <li>To understand which features are most helpful</li>
            <li>To fix technical issues and optimize performance</li>
            <li>To personalize recommendations (only if you create a health profile)</li>
          </ul>

          <h2>Analytics Technologies We Use</h2>
          <p>We use privacy-respecting analytics services:</p>
          <ul>
            <li><strong>Plausible Analytics:</strong> GDPR-compliant, cookie-free analytics that doesn&apos;t track individual users</li>
            <li><strong>PostHog:</strong> Product analytics configured for privacy protection, respects Do Not Track settings</li>
            <li><strong>Vercel Analytics:</strong> Performance monitoring with no personal data collection</li>
          </ul>

          <h2>Data Sharing and Third Parties</h2>
          <p>We may share your information only in these limited circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With secure hosting services and AI providers who help us operate
              the platform (they cannot use your data for their own purposes)</li>
            <li><strong>Medical Databases:</strong> We access public databases like ClinicalTrials.gov to provide
              up-to-date trial information</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
          </ul>
          <p>
            <strong>We never:</strong> Sell your data, share individual user behavior, use your data for advertising,
            create personal profiles for marketing, or track you across other websites.
          </p>

          <h2>Data Security</h2>
          <p>We implement stringent security measures:</p>
          <ul>
            <li>All data transmitted using HTTPS encryption</li>
            <li>Health profiles encrypted at rest</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
            <li>Secure authentication requirements</li>
          </ul>

          <h2>Your Privacy Rights</h2>
          <p>You have complete control over your data:</p>
          <ul>
            <li>Access all information we have about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Export your health profile in a portable format</li>
            <li>Opt-out of analytics tracking</li>
            <li>Use our service completely anonymously</li>
            <li>Delete your account and all associated data</li>
          </ul>
          <p>To exercise any of these rights, contact us at hi@onco.bot</p>

          <h2>Data Retention</h2>
          <ul>
            <li><strong>Analytics data:</strong> Aggregated after 30 days, deleted after 1 year</li>
            <li><strong>Health profiles:</strong> Deleted 90 days after last activity</li>
            <li><strong>Session data:</strong> Cleared when you close your browser</li>
            <li><strong>Search history:</strong> Not stored beyond current session</li>
            <li><strong>Error logs:</strong> Retained for 30 days for debugging</li>
          </ul>

          <h2>Do Not Track</h2>
          <p>
            We respect your browser&apos;s &quot;Do Not Track&quot; setting. When enabled, we will not collect any analytics data
            about your usage.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            OncoBot is designed for healthcare professionals and adult patients. We do not knowingly collect information
            from anyone under 18. If you believe a child has provided us with personal information, please contact us
            immediately.
          </p>

          <h2>International Users</h2>
          <p>
            Data may be processed in the United States. We comply with applicable international privacy laws including
            GDPR (EU users) and CCPA (California users).
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by
            posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
          <p>
            <a href="mailto:hi@onco.bot" className="flex items-center gap-1">
              hi@onco.bot <ExternalLink className="h-4 w-4" />
            </a>
          </p>

          <div className="my-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              By using OncoBot, you agree to our Privacy Policy and our{' '}
              <Link href="/terms" className="underline">
                Terms of Service
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
                © {new Date().getFullYear()} OncoBot by Zeno Shin
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Home
              </Link>
              <Link href="/about" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                About
              </Link>
              <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Terms
              </Link>
              <Link href="/privacy-policy" className="text-neutral-900 dark:text-neutral-100 font-medium">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
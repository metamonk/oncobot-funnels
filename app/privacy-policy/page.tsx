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
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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

          <h2>Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>
              <strong>Medical Queries:</strong> Questions and searches related to oncology, treatments, and clinical trials.
            </li>
            <li>
              <strong>Health Profile Data:</strong> Optional health information you provide for clinical trial matching,
              including cancer type, stage, biomarkers, and treatment history. This information is used solely to provide
              relevant clinical trial recommendations.
            </li>
            <li>
              <strong>Account Information:</strong> Email address and authentication details required for account creation.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with our service, including features used
              and search patterns.
            </li>
            <li>
              <strong>Device Information:</strong> Technical information about your device, browser type, and operating
              system for service optimization.
            </li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use your information for the following purposes:</p>
          <ul>
            <li>To provide medical oncology information and clinical trial matching services</li>
            <li>To improve the accuracy and relevance of medical information provided</li>
            <li>To match health profiles with appropriate clinical trials when requested</li>
            <li>To ensure the security and proper functioning of our platform</li>
            <li>To comply with legal and regulatory requirements</li>
            <li>To analyze usage patterns to improve our medical information services</li>
          </ul>
          <p>
            <strong>Important:</strong> We never sell or share your health information with third parties for marketing
            purposes. Health profile data is used exclusively for providing clinical trial matching services.
          </p>

          <h2>Data Sharing and Disclosure</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>
              <strong>Service Providers:</strong> With third-party service providers who help us operate, improve, and
              analyze our service. Specifically, we use services from:
            </li>
            <ul>
              <li>
                <strong>Infrastructure Providers:</strong> We use secure hosting services to maintain our platform
              </li>
              <li>
                <strong>AI Processing Partners:</strong> We utilize AI services to process medical queries. These partners
                do not store or have access to your health profile data
              </li>
              <li>
                <strong>Medical Databases:</strong> We access public medical databases like ClinicalTrials.gov to provide
                up-to-date clinical trial information
              </li>
            </ul>
            <li>
              <strong>Compliance with Laws:</strong> When required by applicable law, regulation, legal process, or
              governmental request.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
            </li>
          </ul>

          <h2>Data Security and Health Information Protection</h2>
          <p>
            We implement stringent security measures to protect your personal and health information:
          </p>
          <ul>
            <li>Encryption of health data in transit and at rest</li>
            <li>Access controls limiting who can view health information</li>
            <li>Regular security audits and updates</li>
            <li>Secure authentication requirements for all users</li>
            <li>Compliance with healthcare data protection best practices</li>
          </ul>
          <p>
            While we employ industry-standard security measures, no method of transmission over the Internet is 100%
            secure. We continuously work to enhance our security practices to protect your sensitive health information.
          </p>

          <h2>Your Rights and Health Data Control</h2>
          <p>You have the following rights regarding your personal and health information:</p>
          <ul>
            <li>Access all personal and health information we hold about you</li>
            <li>Request correction or deletion of your health profile data at any time</li>
            <li>Export your health profile information in a portable format</li>
            <li>Opt-out of any data processing activities</li>
            <li>Withdraw consent for health data processing</li>
            <li>Request complete deletion of your account and all associated data</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at the email address provided below. We will respond to
            your request within 30 days.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide our services and comply with legal obligations:
          </p>
          <ul>
            <li>Health profile data is retained until you request deletion or delete your account</li>
            <li>Search queries may be retained in anonymized form for service improvement</li>
            <li>Account information is retained for the duration of your account&apos;s existence</li>
            <li>We promptly delete all personal and health data upon account deletion</li>
          </ul>

          <h2>Children&apos;s Privacy</h2>
          <p>
            OncoBot is designed for use by healthcare professionals and adult patients. Our service is not directed to
            children under the age of 18. We do not knowingly collect personal or health information from minors. If you
            are a parent or guardian and believe your child has provided us with personal information, please contact us
            immediately.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>
            <a href="mailto:zeno@ratlabs.xyz" className="flex items-center gap-1">
              zeno@ratlabs.xyz <ExternalLink className="h-4 w-4" />
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

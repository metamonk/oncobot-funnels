'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, Bot, Shield, Brain } from 'lucide-react';
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

export default function AITermsPage() {
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
              <h1 className="text-4xl font-bold tracking-tight">AI Terms of Use</h1>
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
          
          {/* Important Notice Box */}
          <div className="not-prose mb-8 p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Critical Medical AI Notice
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                  OncoBot uses artificial intelligence to provide medical information. AI-generated content may contain 
                  errors, omissions, or inaccuracies. <strong>Always verify all information with qualified healthcare 
                  professionals before making any medical decisions.</strong> OncoBot is an informational tool only and 
                  does not replace professional medical judgment.
                </p>
              </div>
            </div>
          </div>

          <p className="text-lg">
            These AI Terms of Use (&quot;AI Terms&quot;) supplement our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link> and govern your use of OncoBot&apos;s 
            artificial intelligence features. By using our AI-powered features, you acknowledge and agree to these 
            additional terms.
          </p>

          <h2>1. Nature of AI Services</h2>
          <p>
            OncoBot utilizes various AI models and technologies to process medical queries and provide information 
            about oncology, clinical trials, and treatment options. Our AI services include:
          </p>
          <ul>
            <li>Natural language processing of medical queries</li>
            <li>Clinical trial matching and recommendation</li>
            <li>Medical literature synthesis and summarization</li>
            <li>Treatment guideline interpretation</li>
            <li>Drug interaction and side effect information retrieval</li>
          </ul>

          <h2>2. AI Providers and Technology</h2>
          <p>
            We integrate with multiple AI technology providers to deliver our services:
          </p>
          <ul>
            <li><strong>OpenAI</strong> (GPT models)</li>
            <li><strong>Anthropic</strong> (Claude models)</li>
            <li><strong>xAI</strong> (Grok models)</li>
            <li><strong>Google</strong> (Gemini models)</li>
            <li><strong>Mistral AI</strong> (Mistral models)</li>
            <li><strong>Groq</strong> (LPU inference)</li>
          </ul>
          <p>
            Each provider has their own terms of service and data processing policies. We select the most appropriate 
            model based on the query type, required accuracy, and response speed.
          </p>

          <h2>3. Accuracy and Limitations</h2>
          
          <div className="not-prose my-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  AI Limitations You Must Understand
                </h4>
                <ul className="text-red-800 dark:text-red-200 text-sm space-y-1 list-disc list-inside">
                  <li>AI may generate plausible-sounding but incorrect information</li>
                  <li>AI cannot access real-time patient data or medical records</li>
                  <li>AI may not reflect the most recent medical research or guidelines</li>
                  <li>AI cannot diagnose conditions or prescribe treatments</li>
                  <li>AI responses may exhibit biases present in training data</li>
                </ul>
              </div>
            </div>
          </div>

          <p>
            You acknowledge that AI-generated content:
          </p>
          <ul>
            <li>May contain factual errors, even when appearing authoritative</li>
            <li>Should never be the sole basis for medical decisions</li>
            <li>May not be suitable for your specific medical situation</li>
            <li>Requires verification from qualified healthcare professionals</li>
            <li>May become outdated as medical knowledge evolves</li>
          </ul>

          <h2>4. Acceptable Use of AI Features</h2>
          <p>
            You agree to use OncoBot&apos;s AI features only for lawful purposes and in accordance with these terms:
          </p>
          
          <h3>Permitted Uses:</h3>
          <ul>
            <li>Educational research about oncology topics</li>
            <li>Preliminary exploration of clinical trial options</li>
            <li>Understanding general treatment approaches</li>
            <li>Learning about drug mechanisms and side effects</li>
            <li>Preparing questions for healthcare providers</li>
          </ul>

          <h3>Prohibited Uses:</h3>
          <ul>
            <li>Making medical decisions without professional consultation</li>
            <li>Diagnosing medical conditions</li>
            <li>Determining treatment plans without physician oversight</li>
            <li>Emergency medical situations requiring immediate care</li>
            <li>Attempting to reverse-engineer or extract AI model parameters</li>
            <li>Using AI outputs to train competing AI models</li>
            <li>Automated or systematic queries to scrape information</li>
            <li>Generating content for misleading or harmful purposes</li>
          </ul>

          <h2>5. Your Inputs and AI Outputs</h2>
          
          <h3>Your Inputs:</h3>
          <p>
            When you submit queries to OncoBot:
          </p>
          <ul>
            <li>You retain ownership of your input content</li>
            <li>We may use inputs to improve our services (anonymized)</li>
            <li>Do not include personally identifiable information in queries</li>
            <li>Health profile data is NOT sent to AI providers</li>
          </ul>

          <h3>AI Outputs:</h3>
          <p>
            Regarding content generated by our AI:
          </p>
          <ul>
            <li>Outputs may not be unique to you</li>
            <li>Similar queries may generate identical responses</li>
            <li>You may use outputs for personal, non-commercial purposes</li>
            <li>Commercial use requires explicit permission</li>
            <li>We do not claim copyright on AI-generated outputs</li>
          </ul>

          <h2>6. Privacy and Data Processing</h2>
          <p>
            Our AI features are designed with privacy in mind:
          </p>
          <ul>
            <li>Queries are anonymized before processing</li>
            <li>Health profiles are never sent to AI providers</li>
            <li>AI providers do not retain your query data</li>
            <li>We do not use AI to create user profiles</li>
            <li>Session data is not used for AI training</li>
          </ul>
          <p>
            For complete privacy information, see our{' '}
            <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The AI technology, models, and underlying systems remain the property of their respective owners:
          </p>
          <ul>
            <li>You do not acquire any rights to the AI models</li>
            <li>OncoBot&apos;s proprietary prompts and configurations are protected</li>
            <li>Medical content may be subject to third-party copyrights</li>
            <li>You may not attempt to extract or reverse-engineer AI systems</li>
          </ul>

          <h2>8. Disclaimers and Liability</h2>
          
          <div className="not-prose my-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Legal Disclaimers
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  AI services are provided &quot;AS IS&quot; without warranties of any kind. We disclaim all liability 
                  for damages arising from AI use, including but not limited to medical decisions based on AI outputs. 
                  You assume all risks associated with using AI-generated information.
                </p>
              </div>
            </div>
          </div>

          <p>
            <strong>OncoBot and its AI providers are not liable for:</strong>
          </p>
          <ul>
            <li>Errors, omissions, or inaccuracies in AI outputs</li>
            <li>Medical decisions based on AI information</li>
            <li>Harm resulting from reliance on AI content</li>
            <li>AI service interruptions or unavailability</li>
            <li>Changes in AI model behavior or capabilities</li>
          </ul>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless OncoBot, its affiliates, and AI providers from any claims, 
            damages, or expenses arising from:
          </p>
          <ul>
            <li>Your use or misuse of AI features</li>
            <li>Medical decisions based on AI outputs</li>
            <li>Violation of these AI Terms</li>
            <li>Infringement of third-party rights</li>
          </ul>

          <h2>10. Updates to AI Services</h2>
          <p>
            We continuously improve our AI capabilities. This means:
          </p>
          <ul>
            <li>AI models may be updated or replaced without notice</li>
            <li>Response quality and style may change over time</li>
            <li>New features may be added or removed</li>
            <li>Different models may be used for different query types</li>
          </ul>

          <h2>11. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to AI features if you:
          </p>
          <ul>
            <li>Violate these AI Terms or our Terms of Service</li>
            <li>Attempt to abuse or manipulate AI systems</li>
            <li>Use AI features for prohibited purposes</li>
            <li>Exceed reasonable usage limits</li>
          </ul>

          <h2>12. Governing Law</h2>
          <p>
            These AI Terms are governed by the same laws as our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>. In case of conflict between these 
            AI Terms and the Terms of Service, these AI Terms prevail for AI-related matters.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            For questions about our AI features or these terms, contact us at:
          </p>
          <p>
            <a href="mailto:hi@onco.bot" className="flex items-center gap-1">
              hi@onco.bot <ExternalLink className="h-4 w-4" />
            </a>
          </p>

          {/* Final Notice */}
          <div className="not-prose mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Remember: AI is a Tool, Not a Doctor
                </h3>
                <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">
                  OncoBot&apos;s AI is designed to assist and inform, not to replace medical professionals. Every piece 
                  of AI-generated information should be discussed with qualified healthcare providers who understand your 
                  complete medical history and can provide personalized medical advice.
                </p>
              </div>
            </div>
          </div>

          <div className="my-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              By using OncoBot&apos;s AI features, you acknowledge that you have read, understood, and agree to these 
              AI Terms of Use, our{' '}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>
              , and our{' '}
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
              <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Terms
              </Link>
              <Link href="/privacy-policy" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                Privacy
              </Link>
              <Link href="/ai-terms" className="text-neutral-900 dark:text-neutral-100 font-medium">
                AI Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
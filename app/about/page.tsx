/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Brain,
  Command,
  GraduationCap,
  Image as ImageIcon,
  Search,
  Sparkles,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Check,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextLoop } from '@/components/core/text-loop';
import { TextShimmer } from '@/components/core/text-shimmer';
import { OncoBotLogo } from '@/components/logos/oncobot-logo';
import { useRouter } from 'next/navigation';
import { Github, X } from 'lucide-react';
import {
  ProAccordion,
  ProAccordionItem,
  ProAccordionTrigger,
  ProAccordionContent,
} from '@/components/ui/pro-accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { models } from '@/ai/providers';

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

export default function AboutPage() {
  const router = useRouter();
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  useEffect(() => {
    // Check if user has seen the terms
    const hasAcceptedTerms = localStorage.getItem('hasAcceptedTerms');
    if (!hasAcceptedTerms) {
      setShowTermsDialog(true);
    }

  }, []);

  const handleAcceptTerms = () => {
    if (acceptedTerms) {
      setShowTermsDialog(false);
      localStorage.setItem('hasAcceptedTerms', 'true');
    }
  };


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query')?.toString();
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-background border border-border">
          <div className="p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <FileText className="size-5" />
                Terms and Privacy
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Please review our Terms of Service and Privacy Policy before continuing.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Terms of Service
              </h3>
              <p className="text-xs text-muted-foreground">
                By using OncoBot, you agree to our Terms of Service which outline the rules for using our medical information platform.
                This includes important disclaimers about medical advice, acceptable use, and limitations of liability. OncoBot is designed
                to assist healthcare professionals and should not replace professional medical judgment.
              </p>
              <Link href="/terms" className="text-xs text-primary hover:underline inline-flex items-center">
                Read full Terms of Service
                <ArrowUpRight className="size-3 ml-1" />
              </Link>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Privacy Policy
              </h3>
              <p className="text-xs text-muted-foreground">
                Our Privacy Policy describes how we collect, use, and protect your personal and health-related information.
                We comply with healthcare privacy regulations and are committed to maintaining the confidentiality of all medical
                data and patient information shared through our platform.
              </p>
              <Link href="/privacy-policy" className="text-xs text-primary hover:underline inline-flex items-center">
                Read full Privacy Policy
                <ArrowUpRight className="size-3 ml-1" />
              </Link>
            </div>
          </div>

          <div className="px-6 pt-1 pb-4">
            <div className="flex items-start space-x-3 p-3 rounded-md bg-accent/50 border border-border">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={() => setAcceptedTerms(!acceptedTerms)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2">
            <Button onClick={handleAcceptTerms} disabled={!acceptedTerms} className="w-full">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <OncoBotLogo 
              size="sm"
              variant="default"
              className="text-foreground dark:text-gray-200"
            />
            <span className="font-medium font-mono">oncobot</span>
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Privacy
            </Link>
            <Link
              href="https://github.com/metamonk/oncobot-v3"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-40">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div className="space-y-20 text-center" variants={container} initial="hidden" animate="show">
            {/* Logo & Brand */}
            <motion.div variants={item} className="space-y-8">
              <Link href="/" className="inline-flex items-center gap-4 group">
                <div className="relative">
                  <OncoBotLogo 
                    size="md"
                    variant="default"
                    className="text-foreground dark:text-gray-200 transition-all duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="text-4xl font-medium tracking-tight font-mono">oncobot</span>
              </Link>

              <div className="space-y-5">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-balance max-w-5xl mx-auto leading-tight font-be-vietname-pro">
                  Open Source Medical
                  <br />
                  Oncology AI Assistant
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Evidence-based cancer treatment insights powered by AI and medical databases.
                  <br />
                  Built for healthcare professionals and patients.
                </p>
              </div>
            </motion.div>

            {/* Search Interface */}
            <motion.div variants={item} className="space-y-10">
              <form className="max-w-3xl mx-auto" onSubmit={handleSearch}>
                <div className="relative group">
                  <input
                    type="text"
                    name="query"
                    placeholder="Ask anything..."
                    className="w-full h-16 px-6 pr-20 text-lg rounded-2xl bg-background border-2 border-border focus:border-foreground focus:outline-none transition-all duration-300 placeholder:text-muted-foreground shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 h-12 px-6 rounded-xl bg-foreground text-background font-medium hover:scale-105 transition-all duration-200"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Action Button */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex h-12 items-center gap-2 px-6 rounded-xl bg-foreground text-background hover:scale-105 transition-all duration-200"
                >
                  <span className="font-medium">Try Now</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Search Simulation */}
      <section className="py-24 px-4 border-y border-border bg-accent/20">
        <div className="container max-w-screen-xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium tracking-tight">RAG & Search Grounding</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                OncoBot combines RAG and search grounding to deliver accurate, up-to-date answers from reliable sources.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-xs text-muted-foreground">Search Demo</div>
              </div>
              <div className="p-6 space-y-6">
                {/* Query */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent shrink-0"></div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Query</p>
                    <p className="font-medium">What are the latest immunotherapy options for melanoma patients?</p>
                  </div>
                </div>

                {/* Processing */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Processing</p>
                      <TextLoop interval={1.5}>
                        <p className="text-sm font-medium">🔍 Searching medical databases...</p>
                        <p className="text-sm font-medium">📚 Analyzing clinical trials...</p>
                        <p className="text-sm font-medium">🤖 Processing oncology guidelines...</p>
                        <p className="text-sm font-medium">✨ Synthesizing treatment options...</p>
                      </TextLoop>
                    </div>
                    <div className="space-y-1.5">
                      <TextShimmer className="text-sm leading-relaxed font-medium">
                        Cross-referencing NCCN guidelines with recent clinical data...
                      </TextShimmer>
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Response</p>
                    <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
                      <p>
                        For advanced melanoma, current immunotherapy options include checkpoint inhibitors such as
                        pembrolizumab and nivolumab, which have shown significant survival benefits...
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <div className="text-xs py-1 px-2 bg-accent rounded-md text-accent-foreground">
                          Nature Physics
                        </div>
                        <div className="text-xs py-1 px-2 bg-accent rounded-md text-accent-foreground">
                          IBM Research
                        </div>
                        <div className="text-xs py-1 px-2 bg-accent rounded-md text-accent-foreground">
                          MIT Technology Review
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Models Section */}
      <section className="py-24 px-4 bg-accent/10 border-y border-border">
        <div className="container mx-auto">
          <motion.div
            className="mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium tracking-tight">Powered By Advanced Models</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Each model is carefully selected for its unique strengths
              </p>
            </div>

            <div className="!max-w-4xl w-full mx-auto">
              <div className="bg-card rounded border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="!w-full">
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/20">
                        <TableHead className="w-[280px] py-3 px-6 font-medium text-foreground">Model</TableHead>
                        <TableHead className="py-3 px-6 font-medium text-foreground">Description</TableHead>
                        <TableHead className="w-[100px] py-3 px-6 font-medium text-foreground">Category</TableHead>
                        <TableHead className="w-[200px] py-3 px-6 font-medium text-foreground">Capabilities</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.map((model: any) => (
                        <TableRow
                          key={model.value}
                          className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                        >
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-foreground">{model.label}</span>
                              <div className="flex gap-1">
                                {model.pro && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                    Pro
                                  </span>
                                )}
                                {model.experimental && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                    Exp
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <span className="text-xs bg-accent px-2 py-1 rounded text-accent-foreground">
                              {model.category}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-1 flex-wrap">
                              {model.vision && (
                                <span className="text-xs bg-accent px-2 py-1 rounded text-accent-foreground">
                                  Vision
                                </span>
                              )}
                              {model.reasoning && (
                                <span className="text-xs bg-accent px-2 py-1 rounded text-accent-foreground">
                                  Reasoning
                                </span>
                              )}
                              {model.pdf && (
                                <span className="text-xs bg-accent px-2 py-1 rounded text-accent-foreground">PDF</span>
                              )}
                              {!model.vision && !model.reasoning && !model.pdf && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-accent/10">
        <div className="container max-w-screen-xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium tracking-tight">Built For Everyone</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you need quick answers or in-depth research, OncoBot adapts to your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                className="group relative p-6 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
                whileHover={{ y: -2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <h3 className="font-medium">Patients</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Treatment options information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Clinical trial matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Side effect management</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
              <motion.div
                className="group relative p-6 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
                whileHover={{ y: -2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <h3 className="font-medium">Clinical Coordinators</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Patient eligibility screening</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Protocol management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Treatment coordination</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
              <motion.div
                className="group relative p-6 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
                whileHover={{ y: -2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <h3 className="font-medium">Researchers</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Oncology literature review</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Clinical data analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Treatment outcome research</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="container max-w-screen-xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium tracking-tight">Advanced Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experience advanced medical AI capabilities designed for oncology professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: 'Clinical Intelligence',
                  description: 'Analyzes complex oncology cases and treatment patterns',
                },
                {
                  icon: Search,
                  title: 'Medical Database Search',
                  description: 'Searches clinical trials, guidelines, and research papers',
                },
                {
                  icon: ImageIcon,
                  title: 'Scan Analysis',
                  description: 'Interprets medical imaging and pathology reports',
                },
                {
                  icon: Command,
                  title: 'Dosage Calculations',
                  description: 'Calculates chemotherapy dosing and treatment schedules',
                },
                {
                  icon: GraduationCap,
                  title: 'Evidence-Based Insights',
                  description: 'Provides latest oncology research and clinical guidelines',
                },
                {
                  icon: Sparkles,
                  title: 'Patient-Friendly Explanations',
                  description: 'Translates complex medical terms clearly',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="group relative p-6 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
                  whileHover={{ y: -2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-4">
                    <div className="p-2.5 w-fit rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-accent/10">
        <div className="container max-w-screen-xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium tracking-tight">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Find answers to common questions about OncoBot</p>
            </div>

            <ProAccordion type="single" collapsible className="w-full">
              <ProAccordionItem value="item-1">
                <ProAccordionTrigger>What is OncoBot?</ProAccordionTrigger>
                <ProAccordionContent>
                  OncoBot is an open-source AI-powered medical oncology assistant that provides evidence-based information
                  about cancer treatments, clinical trials, and patient care using advanced AI models and medical databases.
                </ProAccordionContent>
              </ProAccordionItem>

              <ProAccordionItem value="item-2">
                <ProAccordionTrigger>Is OncoBot suitable for medical decision-making?</ProAccordionTrigger>
                <ProAccordionContent>
                  OncoBot is designed to assist healthcare professionals by providing information from medical databases
                  and research. However, it should not replace professional medical judgment. Always verify information
                  and consult appropriate medical resources for clinical decisions.
                </ProAccordionContent>
              </ProAccordionItem>

              <ProAccordionItem value="item-3">
                <ProAccordionTrigger>What medical databases does OncoBot access?</ProAccordionTrigger>
                <ProAccordionContent>
                  OncoBot accesses multiple medical databases including ClinicalTrials.gov for trial information,
                  academic research papers through advanced search APIs, and integrates with current oncology guidelines. 
                  It also uses AI models trained on medical literature.
                </ProAccordionContent>
              </ProAccordionItem>

              <ProAccordionItem value="item-4">
                <ProAccordionTrigger>How does the health profile feature work?</ProAccordionTrigger>
                <ProAccordionContent>
                  The health profile feature allows users to input patient characteristics, cancer type, stage,
                  and molecular markers. This information is used to provide personalized clinical trial matching
                  and treatment recommendations based on current guidelines.
                </ProAccordionContent>
              </ProAccordionItem>

              <ProAccordionItem value="item-5">
                <ProAccordionTrigger>What AI models does OncoBot use?</ProAccordionTrigger>
                <ProAccordionContent>
                  OncoBot uses a range of advanced AI models including Grok 3.0, Claude 3.7 Sonnet, OpenAI GPT 4o, Gemini
                  2.5 Pro, and more to provide the best possible answers.
                </ProAccordionContent>
              </ProAccordionItem>

              <ProAccordionItem value="item-6">
                <ProAccordionTrigger>How does OncoBot ensure information accuracy?</ProAccordionTrigger>
                <ProAccordionContent>
                  OncoBot combines RAG technology with search grounding to retrieve information from reliable sources and
                  verify it before providing answers. Each response includes source attribution.
                </ProAccordionContent>
              </ProAccordionItem>

            </ProAccordion>

            <div className="text-center pt-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Have more questions?{' '}
                <a
                  href="mailto:zeno@ratlabs.xyz"
                  className="text-foreground hover:underline underline-offset-4 decoration-muted-foreground transition-colors duration-200"
                >
                  Get in touch
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container max-w-screen-xl mx-auto py-12 px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <OncoBotLogo size="sm" variant="default" className="text-foreground dark:text-gray-200" />
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="https://x.com/oncobotai"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <X className="h-4 w-4" />
                </Link>
                <Link
                  href="https://github.com/metamonk/oncobot-v3"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

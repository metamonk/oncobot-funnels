'use client';

import {
  ProAccordion,
  ProAccordionItem,
  ProAccordionTrigger,
  ProAccordionContent,
} from '@/components/ui/pro-accordion';
import { motion } from 'framer-motion';

export function FAQ() {
  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-4">
              Everything you need to know about clinical trial eligibility
            </p>
          </div>

          <ProAccordion type="single" collapsible className="w-full">
            <ProAccordionItem value="item-1">
              <ProAccordionTrigger>Does this cost anything?</ProAccordionTrigger>
              <ProAccordionContent>
                No. Checking eligibility is free. All trial-related medical care, study medications, 
                and procedures are provided at no cost to participants. Many trials also provide 
                compensation for time and travel expenses.
              </ProAccordionContent>
            </ProAccordionItem>

            <ProAccordionItem value="item-2">
              <ProAccordionTrigger>Will you give me medical advice?</ProAccordionTrigger>
              <ProAccordionContent>
                No. We help explore trial options and connect you with trial coordinators. 
                All medical decisions should be made with your doctor. We provide information 
                about available trials, but we don&apos;t diagnose conditions or recommend 
                specific treatments.
              </ProAccordionContent>
            </ProAccordionItem>

            <ProAccordionItem value="item-3">
              <ProAccordionTrigger>How fast will I hear back?</ProAccordionTrigger>
              <ProAccordionContent>
                If a potential match appears, we aim to contact you within 24 hours on business days. 
                Most patients receive a call within 1-2 business days after completing the eligibility 
                check. For urgent situations, you can call us directly at 1-800-TRIALS.
              </ProAccordionContent>
            </ProAccordionItem>

            <ProAccordionItem value="item-4">
              <ProAccordionTrigger>Is my data safe?</ProAccordionTrigger>
              <ProAccordionContent>
                Yes—HIPAA-secure. We use bank-level encryption to protect your information. 
                We don&apos;t sell your data to third parties. Your information is only used 
                to match you with relevant trials and have coordinators contact you about 
                potential opportunities. You can request deletion of your data at any time.
              </ProAccordionContent>
            </ProAccordionItem>

            <ProAccordionItem value="item-5">
              <ProAccordionTrigger>What if I don&apos;t qualify for any trials?</ProAccordionTrigger>
              <ProAccordionContent>
                Trials open and close frequently. If you don&apos;t match with a trial today, 
                we&apos;ll add you to our waitlist and notify you immediately when new trials 
                matching your profile become available. We continuously monitor for new opportunities 
                and many patients who don&apos;t initially qualify find matches within a few weeks.
              </ProAccordionContent>
            </ProAccordionItem>

            <ProAccordionItem value="item-6">
              <ProAccordionTrigger>Can I withdraw from a trial after joining?</ProAccordionTrigger>
              <ProAccordionContent>
                Yes, absolutely. Participation in clinical trials is completely voluntary. 
                You can withdraw at any time for any reason without affecting your regular 
                medical care. The trial team will explain the withdrawal process during 
                your initial consultation.
              </ProAccordionContent>
            </ProAccordionItem>
          </ProAccordion>

          <div className="text-center pt-8">
            <p className="text-muted-foreground text-sm">
              Have more questions?{' '}
              <a
                href="mailto:support@onco.bot"
                className="text-primary hover:underline underline-offset-4 transition-colors"
              >
                Get in touch
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
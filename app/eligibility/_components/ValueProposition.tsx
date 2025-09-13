'use client';

import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ValuePropositionProps {
  points: string[];
}

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

export function ValueProposition({ points }: ValuePropositionProps) {

  return (
    <section className="py-24 bg-accent/10 border-y border-border">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto space-y-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Why Join a Clinical Trial?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get access to tomorrow&apos;s treatments today, with comprehensive care at no cost
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 gap-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {points.map((point, index) => (
              <motion.div key={index} variants={item}>
                <div className="w-full rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 overflow-hidden hover:border-primary/50 transition-colors h-full">
                  <div className="px-4 py-3 flex items-center gap-2.5 h-full">
                    <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{point}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Proof Section */}
          <div className="text-center pt-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">10,247 patients</span> matched to trials this year
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
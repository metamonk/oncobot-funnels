import { Check } from 'lucide-react';

interface ValuePropositionProps {
  points: string[];
}

export function ValueProposition({ points }: ValuePropositionProps) {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            Why Join a Clinical Trial?
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Get access to tomorrow&apos;s treatments today, with comprehensive care at no cost
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {points.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 rounded-lg bg-purple-50/50 border border-purple-200/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100/80 flex items-center justify-center">
                <Check className="h-5 w-5 text-purple-500" strokeWidth={2.5} />
              </div>
              <p className="text-[15px] text-gray-700 leading-relaxed pt-1">{point}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-[15px]">
          <span className="font-semibold text-gray-900">Join thousands of patients</span> searching for clinical trials
        </p>
      </div>
    </section>
  );
}
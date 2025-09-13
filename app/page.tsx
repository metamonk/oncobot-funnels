import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const indications = [
    {
      id: 'lung',
      name: 'Lung Cancer',
      description: 'NSCLC, SCLC, and mesothelioma trials',
      count: '500+ trials'
    },
    {
      id: 'prostate',
      name: 'Prostate Cancer',
      description: 'Localized and metastatic prostate cancer trials',
      count: '300+ trials'
    },
    {
      id: 'gi',
      name: 'GI Cancers',
      description: 'Colorectal, pancreatic, liver, and stomach trials',
      count: '400+ trials'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-screen-xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Find Your Clinical Trial Match
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with cutting-edge cancer clinical trials in your area. 
            Free eligibility check in 2 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {indications.map((indication) => (
            <Card key={indication.id} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">{indication.name}</h3>
              <p className="text-muted-foreground mb-4">{indication.description}</p>
              <p className="text-sm font-medium text-primary mb-4">{indication.count}</p>
              <Button asChild className="w-full">
                <Link href={`/eligibility/${indication.id}`}>
                  Check Eligibility
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            For healthcare providers: <Link href="/providers" className="text-primary hover:underline">Partner with us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
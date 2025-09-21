./app/eligibility/_components/HeroContextAware.tsx:73:20
Type error: Property 'visitCount' does not exist on type '{ indication: string; }'.
  71 |     <section className="relative py-12 sm:py-16 lg:py-20">
  72 |       {/* Urgency banner for returning visitors */}
> 73 |       {userContext.visitCount && userContext.visitCount > 1 && (
     |                    ^
  74 |         <div className="absolute top-0 left-0 right-0 bg-primary/10 py-2 text-center">
  75 |           <p className="text-sm font-medium">
  76 |             Welcome back! New trials have been added since your last visit.
Next.js build worker exited with code: 1 and signal: null
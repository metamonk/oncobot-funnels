'use client';

import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { InstallPrompt } from '@/components/InstallPrompt';
import { EligibilityResumeHandler } from '@/components/clinical-trials/eligibility-resume-handler';

const Home = () => {
  return (
    <Suspense>
      <ChatInterface />
      <InstallPrompt />
      <EligibilityResumeHandler />
    </Suspense>
  );
};

export default Home;

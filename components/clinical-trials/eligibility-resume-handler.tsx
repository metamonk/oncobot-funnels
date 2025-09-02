'use client';

import { useEffect, useState } from 'react';
import { EligibilityCheckerModal } from './eligibility-checker-modal';
import type { HealthProfile } from '@/lib/tools/clinical-trials/types';

interface ResumeData {
  checkId: string;
  nctId: string;
  trialTitle: string;
}

export function EligibilityResumeHandler() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);

  useEffect(() => {
    // Check if there's a resume request
    const stored = localStorage.getItem('resumeEligibilityCheck');
    if (stored) {
      try {
        const data = JSON.parse(stored) as ResumeData;
        setResumeData(data);
        setModalOpen(true);
        // Clear the localStorage item
        localStorage.removeItem('resumeEligibilityCheck');
      } catch (error) {
        console.error('Failed to parse resume data:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Load health profile from API
    const loadHealthProfile = async () => {
      try {
        const response = await fetch('/api/health-profile');
        if (response.ok) {
          const profile = await response.json();
          setHealthProfile(profile);
        }
      } catch (error) {
        console.error('Failed to load health profile:', error);
      }
    };

    if (resumeData) {
      loadHealthProfile();
    }
  }, [resumeData]);

  if (!resumeData) {
    return null;
  }

  return (
    <EligibilityCheckerModal
      open={modalOpen}
      onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          setResumeData(null);
        }
      }}
      nctId={resumeData.nctId}
      trialTitle={resumeData.trialTitle}
      existingCheckId={resumeData.checkId}
      healthProfile={healthProfile}
      onComplete={() => {
        // Reload the page to refresh any lists
        window.location.reload();
      }}
    />
  );
}
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth-utils';
import { getEligibilityCheckById, getEligibilityCheckByShareToken } from '@/lib/db/eligibility-queries';
import { Metadata } from 'next';
import { config } from '@/lib/config';
import { EligibilityCheckResults } from '@/components/clinical-trials/eligibility-check-results';

// metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  
  // Try to get the check by ID first, then by share token
  let check = await getEligibilityCheckById(id);
  if (!check) {
    check = await getEligibilityCheckByShareToken(id);
  }
  
  if (!check) {
    return { title: 'Eligibility Check - OncoBot' };
  }
  
  const user = await getUser();
  let title = 'Eligibility Check Results';
  
  // Check access permissions
  if (check.visibility === 'private') {
    if (!user || user.id !== check.userId) {
      title = 'Eligibility Check - OncoBot';
    } else {
      title = `${check.trialTitle} - Eligibility Results`;
    }
  } else {
    title = `${check.trialTitle} - Eligibility Results`;
  }
  
  return {
    title,
    description: 'Clinical trial eligibility check results',
    openGraph: {
      title,
      url: `${config.app.url}/eligibility-check/${id}`,
      description: 'Clinical trial eligibility check results',
      siteName: 'OncoBot',
      images: [
        {
          url: `${config.app.url}/api/og/eligibility/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      url: `${config.app.url}/eligibility-check/${id}`,
      description: 'Clinical trial eligibility check results',
      siteName: 'OncoBot',
      creator: '@oncobot',
      images: [
        {
          url: `${config.app.url}/api/og/eligibility/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: {
      canonical: `${config.app.url}/eligibility-check/${id}`,
    },
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  
  // Try to get the check by ID first, then by share token
  let check = await getEligibilityCheckById(id);
  let accessMode: 'owner' | 'shared' | 'none' = 'none';
  
  if (!check) {
    // Try share token for public sharing
    check = await getEligibilityCheckByShareToken(id);
    if (check) {
      accessMode = 'shared';
    }
  } else {
    // Check was found by ID, verify access
    const user = await getUser();
    
    if (check.visibility === 'public') {
      accessMode = user?.id === check.userId ? 'owner' : 'shared';
    } else if (check.visibility === 'private') {
      if (!user || user.id !== check.userId) {
        return notFound();
      }
      accessMode = 'owner';
    }
  }
  
  if (!check || accessMode === 'none') {
    return notFound();
  }
  
  return <EligibilityCheckResults check={check} isOwner={accessMode === 'owner'} />;
}
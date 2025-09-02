import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EligibilityResultsEmailProps {
  trialTitle: string;
  nctId: string;
  eligibilityStatus: string;
  eligibilityScore?: number;
  confidence?: string;
  matchedCriteria?: string[];
  unmatchedCriteria?: string[];
  uncertainCriteria?: string[];
  excludedCriteria?: string[];
  checkUrl: string;
  locations?: Array<{
    facility?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  }>;
}

export const EligibilityResultsEmail = ({
  trialTitle,
  nctId,
  eligibilityStatus,
  eligibilityScore,
  confidence,
  matchedCriteria = [],
  unmatchedCriteria = [],
  uncertainCriteria = [],
  excludedCriteria = [],
  checkUrl,
  locations = [],
}: EligibilityResultsEmailProps) => {
  const previewText = `Your eligibility check results for ${trialTitle}`;

  const getStatusColor = () => {
    switch (eligibilityStatus) {
      case 'LIKELY_ELIGIBLE':
        return '#10b981';
      case 'POSSIBLY_ELIGIBLE':
        return '#f59e0b';
      case 'UNCERTAIN':
        return '#6b7280';
      case 'LIKELY_INELIGIBLE':
        return '#f97316';
      case 'INELIGIBLE':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = () => {
    switch (eligibilityStatus) {
      case 'LIKELY_ELIGIBLE':
        return 'Likely Eligible';
      case 'POSSIBLY_ELIGIBLE':
        return 'Possibly Eligible';
      case 'UNCERTAIN':
        return 'Uncertain';
      case 'LIKELY_INELIGIBLE':
        return 'Likely Ineligible';
      case 'INELIGIBLE':
        return 'Ineligible';
      default:
        return 'Unknown';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Clinical Trial Eligibility Results</Heading>
          
          <Section style={section}>
            <Text style={trialTitleStyle}>{trialTitle}</Text>
            <Text style={nctIdStyle}>NCT ID: {nctId}</Text>
          </Section>

          <Section style={statusSection}>
            <Text style={{ ...statusText, color: getStatusColor() }}>
              {getStatusLabel()}
            </Text>
            {eligibilityScore !== undefined && (
              <Text style={scoreText}>
                Confidence Score: {eligibilityScore}%
                {confidence && ` (${confidence})`}
              </Text>
            )}
          </Section>

          {matchedCriteria.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>✅ Qualifying Factors</Heading>
              {matchedCriteria.map((criterion, index) => (
                <Text key={index} style={listItem}>
                  • {criterion}
                </Text>
              ))}
            </Section>
          )}

          {excludedCriteria.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>❌ Exclusion Criteria</Heading>
              <Text style={{ ...listItem, marginBottom: '12px' }}>
                These factors may disqualify you from this trial:
              </Text>
              {excludedCriteria.map((criterion, index) => (
                <Text key={index} style={listItem}>
                  • {criterion.replace('Excluded due to:', '').trim()}
                </Text>
              ))}
            </Section>
          )}

          {unmatchedCriteria.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>⚠️ Unmet Inclusion Criteria</Heading>
              <Text style={{ ...listItem, marginBottom: '12px' }}>
                These requirements need to be met for eligibility:
              </Text>
              {unmatchedCriteria.map((criterion, index) => (
                <Text key={index} style={listItem}>
                  • {criterion.replace('Does not meet:', '').trim()}
                </Text>
              ))}
            </Section>
          )}

          {uncertainCriteria.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>ℹ️ Uncertain Factors</Heading>
              {uncertainCriteria.map((criterion, index) => (
                <Text key={index} style={listItem}>
                  • {criterion}
                </Text>
              ))}
            </Section>
          )}

          {locations.length > 0 && (
            <Section style={section}>
              <Heading style={h2}>📍 Trial Locations</Heading>
              {locations.map((location, index) => (
                <Text key={index} style={locationItem}>
                  <strong>{location.facility || 'Location ' + (index + 1)}</strong>
                  <br />
                  {[location.city, location.state, location.zip]
                    .filter(Boolean)
                    .join(', ')}
                  {location.country && location.country !== 'United States' && (
                    <>
                      <br />
                      {location.country}
                    </>
                  )}
                </Text>
              ))}
            </Section>
          )}

          <Section style={section}>
            <Link href={checkUrl} style={button}>
              View Full Results
            </Link>
          </Section>

          <Section style={section}>
            <Link 
              href={`https://clinicaltrials.gov/study/${nctId}`} 
              style={secondaryButton}
            >
              View on ClinicalTrials.gov
            </Link>
          </Section>

          <Text style={disclaimer}>
            <strong>Important:</strong> This eligibility assessment is for informational purposes only 
            and does not constitute medical advice. Please consult with your healthcare provider 
            and the clinical trial team for definitive eligibility determination.
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} OncoBot. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '0 48px',
  marginBottom: '32px',
};

const statusSection = {
  padding: '24px 48px',
  backgroundColor: '#f9fafb',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0 48px',
  marginBottom: '24px',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const trialTitleStyle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const nctIdStyle = {
  color: '#666',
  fontSize: '14px',
  fontFamily: 'monospace',
};

const statusText = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const scoreText = {
  color: '#666',
  fontSize: '16px',
};

const listItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const locationItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '5px',
  color: '#374151',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 'bold',
  lineHeight: '1',
  padding: '10px 20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const disclaimer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  padding: '0 48px',
  marginTop: '32px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '32px',
};

export default EligibilityResultsEmail;
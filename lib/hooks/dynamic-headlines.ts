/**
 * Dynamic Headlines System
 *
 * CONTEXT-AWARE: Following CLAUDE.md and HOOKS.md principles
 * - Headlines must match ads exactly for continuity
 * - Use UTM parameters to select headlines
 * - Replace placeholders with actual values
 * - Healthcare-compliant language only
 */

// Headline templates mapped to utm_content values
export const HEADLINE_TEMPLATES = {
  // Most Aware (offer-driven)
  'quick-check': '2-Minute [Indication] Trial Eligibility Check — Free & HIPAA-secure',
  'local-trials': '[Indication] Trials Near [City]? Check Eligibility Now',
  'accepting-now': 'See Trials Accepting Patients This [Month] in [City]',
  'book-call': 'Book a Quick Call to Review Your [Indication] Trial Options',

  // Product Aware (proof-driven)
  'free-check': 'Free [Indication] trial eligibility check — HIPAA-secure',
  'get-matched': 'Get matched with relevant [Indication] trials near [City]',
  'connect-coordinators': 'Connect with trial coordinators after eligibility check',

  // Solution Aware (promise-driven)
  'qualify-check': 'Check if you qualify for a [Indication] trial near you',
  'newly-diagnosed': 'Newly diagnosed? Explore trial eligibility options',
  'prior-therapy': 'Had [Therapy]? Check trial eligibility',

  // Problem Aware (problem framing)
  'limited-options': 'Limited options? Explore local [Indication] trials in minutes',
  'stage-specific': 'Stage [Stage] [Indication]? See nearby trials within [Miles] miles',
  'caregivers': 'Caregivers: quick check for [Indication] trial options near [City]',

  // Biomarker-specific
  'biomarker': 'Biomarker-positive ([Biomarker])? Check local trials',
  'egfr': 'EGFR+ [Indication] Cancer? See Trial Options',
  'brca': 'BRCA+ [Indication]? Find Targeted Therapy Trials',

  // Default fallback
  'default': 'Do you qualify for a [Indication] clinical trial near you?'
};

// Supporting text that rotates (doesn't need to match ads)
export const SUPPORTING_TEXT_ROTATION = [
  'See potential trial options near your ZIP',
  'Talk to a coordinator about next steps',
  'No cost. No obligation',
  'Free eligibility check in 2 minutes',
  'HIPAA-secure and confidential',
  'Get matched with relevant trials'
];

interface PlaceholderData {
  indication?: string;
  city?: string;
  zip?: string;
  miles?: string;
  stage?: string;
  biomarker?: string;
  therapy?: string;
  landmark?: string;
  month?: string;
}

/**
 * Get dynamic headline based on UTM parameters
 * Ensures ad-to-landing-page continuity
 */
export function getDynamicHeadline(
  utmContent: string | null,
  placeholderData: PlaceholderData
): string {
  // Select template based on utm_content or use default
  const templateKey = utmContent || 'default';
  let template = HEADLINE_TEMPLATES[templateKey as keyof typeof HEADLINE_TEMPLATES]
    || HEADLINE_TEMPLATES.default;

  // Replace all placeholders with actual values
  return replacePlaceholders(template, placeholderData);
}

/**
 * Replace placeholders in template with actual values
 * Falls back gracefully when data is unavailable
 */
export function replacePlaceholders(
  template: string,
  data: PlaceholderData
): string {
  let result = template;

  // Indication - use full cancer names for clarity
  if (data.indication) {
    const indicationMap: { [key: string]: string } = {
      'lung': 'Lung Cancer',
      'prostate': 'Prostate Cancer',
      'gi': 'GI Cancer',
      'breast': 'Breast Cancer',
      'other': 'Cancer'
    };
    const indication = indicationMap[data.indication.toLowerCase()] ||
                      (data.indication.charAt(0).toUpperCase() + data.indication.slice(1) + ' Cancer');
    result = result.replace(/\[Indication\]/g, indication);
  }

  // City - from UTM or fallback to "you"
  result = result.replace(/\[City\]/g, data.city || 'you');

  // ZIP - only if available
  result = result.replace(/\[ZIP\]/g, data.zip || 'your area');

  // Miles - from UTM or default
  result = result.replace(/\[Miles\]/g, data.miles || '50');

  // Stage - from UTM
  result = result.replace(/\[Stage\]/g, data.stage || 'IV');

  // Biomarker - from UTM
  result = result.replace(/\[Biomarker\]/g, data.biomarker || 'EGFR/ALK/BRCA/MSI-H');

  // Therapy - from UTM
  result = result.replace(/\[Therapy\]/g, data.therapy || 'chemo/immunotherapy');

  // Landmark - not currently available
  result = result.replace(/\[Landmark\]/g, data.landmark || 'your area');

  // Month - current month
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  result = result.replace(/\[Month\]/g, data.month || currentMonth);

  return result;
}

/**
 * Parse UTM parameters to extract placeholder data
 * Example: utm_content=stage-specific&utm_term=los-angeles&stage=III&miles=25
 */
export function parseUTMData(searchParams: URLSearchParams): PlaceholderData {
  return {
    city: searchParams.get('utm_term') || searchParams.get('city') || undefined,
    stage: searchParams.get('stage') || undefined,
    miles: searchParams.get('miles') || undefined,
    biomarker: searchParams.get('biomarker') || undefined,
    therapy: searchParams.get('therapy') || undefined,
  };
}

/**
 * Get city from ZIP code
 * NOTE: Requires external geocoding service (not implemented)
 * Consider using:
 * - Google Maps Geocoding API
 * - MapBox Geocoding API
 * - Free alternative: zipcodeapi.com
 */
export async function getCityFromZip(zip: string): Promise<string | null> {
  // TODO: Implement geocoding service
  // For now, return null and use fallback
  return null;
}
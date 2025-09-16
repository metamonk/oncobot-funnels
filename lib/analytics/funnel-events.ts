/**
 * Funnel Analytics Events
 * 
 * Comprehensive event tracking for both patient and site funnels
 * Following Alex Hormozi's key metrics for conversion optimization
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Google Analytics 4 Event Parameters
 */
export interface GAEventParams {
  // Standard GA4 parameters
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;

  // Page tracking
  page_path?: string;
  page_location?: string;
  page_title?: string;

  // UTM parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;

  // User properties
  user_id?: string;
  email?: string;
  phone_number?: string;

  // Custom properties
  [key: string]: any;
}

// ============================================================================
// KEY METRICS TO TRACK (Based on Hormozi Principles)
// ============================================================================
/**
 * PATIENT FUNNEL METRICS:
 * 1. Traffic Source & Quality (where are patients coming from?)
 * 2. Landing Page Conversion (headline effectiveness, hook testing)
 * 3. Quiz Start Rate (how compelling is the value prop?)
 * 4. Quiz Completion Rate (are questions too long/complex?)
 * 5. Lead Quality Score (likelihood to enroll)
 * 6. Trial Match Rate (how many get relevant matches?)
 * 7. Contact Rate (how many reach out to sites?)
 * 8. Enrollment Rate (ultimate conversion)
 * 
 * SITE FUNNEL METRICS:
 * 1. Traffic Source (referrals, direct, ads)
 * 2. Membership Page Views (interest level)
 * 3. Booking Page Reach (serious intent)
 * 4. Booking Completion Rate (friction points)
 * 5. Show Rate (do they attend the intake?)
 * 6. Conversion to Paid (membership activation)
 * 7. Retention Rate (monthly churn)
 * 8. Lifetime Value (total revenue per site)
 */

// ============================================================================
// PATIENT FUNNEL EVENTS
// ============================================================================

export const PatientFunnelEvents = {
  // Landing Page Events
  LANDING_PAGE_VIEW: 'patient_landing_page_viewed',
  HOOK_VARIANT_SHOWN: 'patient_hook_variant_shown',
  COUNTDOWN_TIMER_SHOWN: 'patient_countdown_timer_shown',
  VIDEO_TESTIMONIAL_PLAYED: 'patient_video_testimonial_played',
  
  // Quiz Events
  QUIZ_STARTED: 'patient_quiz_started',
  QUIZ_QUESTION_ANSWERED: 'patient_quiz_question_answered',
  QUIZ_ABANDONED: 'patient_quiz_abandoned',
  QUIZ_COMPLETED: 'patient_quiz_completed',
  
  // Lead Capture Events
  LEAD_FORM_STARTED: 'patient_lead_form_started',
  LEAD_FORM_FIELD_COMPLETED: 'patient_lead_form_field_completed',
  LEAD_FORM_SUBMITTED: 'patient_lead_form_submitted',
  LEAD_QUALITY_SCORED: 'patient_lead_quality_scored',
  
  // Trial Matching Events
  TRIAL_SEARCH_INITIATED: 'patient_trial_search_initiated',
  TRIAL_RESULTS_SHOWN: 'patient_trial_results_shown',
  TRIAL_CLICKED: 'patient_trial_clicked',
  TRIAL_DETAILS_VIEWED: 'patient_trial_details_viewed',
  TRIAL_SAVED: 'patient_trial_saved',
  
  // Eligibility Check Events
  ELIGIBILITY_CHECK_STARTED: 'patient_eligibility_check_started',
  ELIGIBILITY_QUESTION_ANSWERED: 'patient_eligibility_question_answered',
  ELIGIBILITY_CHECK_COMPLETED: 'patient_eligibility_check_completed',
  ELIGIBILITY_MATCH_FOUND: 'patient_eligibility_match_found',
  
  // Contact Events
  TRIAL_CONTACT_CLICKED: 'patient_trial_contact_clicked',
  TRIAL_CONTACT_INFO_VIEWED: 'patient_trial_contact_info_viewed',
  TRIAL_SITE_CONTACTED: 'patient_trial_site_contacted',
  
  // Conversion Events
  PATIENT_ENROLLED: 'patient_enrolled_in_trial',
  PATIENT_PRESCREENED: 'patient_prescreened_by_site',
  PATIENT_CONSENTED: 'patient_consented_to_trial',
} as const;

// ============================================================================
// SITE FUNNEL EVENTS
// ============================================================================

export const SiteFunnelEvents = {
  // Homepage Events
  HOMEPAGE_VIEWED: 'site_homepage_viewed',
  HOMEPAGE_CTA_CLICKED: 'site_homepage_cta_clicked',
  
  // Membership Page Events
  MEMBERSHIP_PAGE_VIEWED: 'site_membership_page_viewed',
  MEMBERSHIP_PRICING_VIEWED: 'site_membership_pricing_viewed',
  MEMBERSHIP_TERMS_VIEWED: 'site_membership_terms_viewed',
  MEMBERSHIP_PROOF_VIEWED: 'site_membership_proof_viewed',
  MEMBERSHIP_CTA_CLICKED: 'site_membership_cta_clicked',
  
  // Booking Page Events
  BOOKING_PAGE_VIEWED: 'site_booking_page_viewed',
  BOOKING_TIME_SELECTED: 'site_booking_time_selected',
  BOOKING_FORM_STARTED: 'site_booking_form_started',
  BOOKING_FORM_FIELD_COMPLETED: 'site_booking_form_field_completed',
  BOOKING_FORM_SUBMITTED: 'site_booking_form_submitted',
  
  // Thank You Page Events
  THANK_YOU_PAGE_VIEWED: 'site_thank_you_page_viewed',
  SAMPLE_PROFILES_CLICKED: 'site_sample_profiles_clicked',
  
  // Sample Profiles Events
  SAMPLE_PROFILES_VIEWED: 'site_sample_profiles_viewed',
  SAMPLE_PROFILE_EXPANDED: 'site_sample_profile_expanded',
  SAMPLE_PROFILES_CTA_CLICKED: 'site_sample_profiles_cta_clicked',
  
  // Conversion Events
  PROTOCOL_INTAKE_SCHEDULED: 'site_protocol_intake_scheduled',
  PROTOCOL_INTAKE_ATTENDED: 'site_protocol_intake_attended',
  MEMBERSHIP_ACTIVATED: 'site_membership_activated',
  FIRST_CANDIDATE_RECEIVED: 'site_first_candidate_received',
  CANDIDATE_ACCEPTED: 'site_candidate_accepted',
  CANDIDATE_ENROLLED: 'site_candidate_enrolled',
  
  // Retention Events
  MONTHLY_RENEWAL: 'site_monthly_renewal',
  MEMBERSHIP_CANCELLED: 'site_membership_cancelled',
  MEMBERSHIP_REACTIVATED: 'site_membership_reactivated',
} as const;

// ============================================================================
// FUNNEL PROPERTIES
// ============================================================================

export interface PatientFunnelProperties {
  // User Properties
  userId?: string;
  sessionId?: string;
  session_id?: string; // Support both formats
  
  // Traffic Source
  source?: string;
  medium?: string;
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  
  // Page Properties
  page_url?: string;
  page_title?: string;
  indication?: string;
  
  // Quiz Properties
  question_id?: string;
  question_text?: string;
  answer?: any;
  question_number?: number;
  total_questions?: number;
  time_to_answer?: number;
  
  // Lead Properties
  email?: string;
  phone?: string;
  zipCode?: string;
  cancerType?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
  leadScore?: number;
  
  // Trial Properties
  trialId?: string;
  trialTitle?: string;
  trialPhase?: string;
  trialSponsor?: string;
  matchScore?: number;
  distance?: number;
  
  // Conversion Properties
  conversionValue?: number;
  conversionType?: string;
  
  // A/B Test Properties
  variant?: string;
  experiment?: string;
}

export interface SiteFunnelProperties {
  // Organization Properties
  organizationId?: string;
  organizationName?: string;
  session_id?: string; // Support both formats
  
  // Traffic Source
  source?: string;
  medium?: string;
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  
  // Page Properties
  page_url?: string;
  page_title?: string;
  
  // Booking Properties
  selectedTime?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  indication?: string;
  siteLocation?: string;
  monthlyVolume?: string;
  notes?: string;
  
  // Membership Properties
  membershipTier?: string;
  monthlyValue?: number;
  protocolCount?: number;
  
  // Candidate Properties
  candidateId?: string;
  candidateScore?: number;
  candidateAccepted?: boolean;
  timeToHandoff?: number;
  
  // Retention Properties
  monthsActive?: number;
  lifetimeValue?: number;
  churnReason?: string;
}

// ============================================================================
// CONVERSION GOALS
// ============================================================================

export const ConversionGoals = {
  // Patient Goals
  PATIENT_QUIZ_COMPLETION: {
    event: PatientFunnelEvents.QUIZ_COMPLETED,
    value: 10,
    name: 'Quiz Completion',
  },
  PATIENT_LEAD_CAPTURE: {
    event: PatientFunnelEvents.LEAD_FORM_SUBMITTED,
    value: 25,
    name: 'Lead Captured',
  },
  PATIENT_TRIAL_CONTACT: {
    event: PatientFunnelEvents.TRIAL_SITE_CONTACTED,
    value: 100,
    name: 'Trial Site Contacted',
  },
  PATIENT_ENROLLMENT: {
    event: PatientFunnelEvents.PATIENT_ENROLLED,
    value: 500,
    name: 'Patient Enrolled',
  },
  
  // Site Goals
  SITE_BOOKING_SCHEDULED: {
    event: SiteFunnelEvents.PROTOCOL_INTAKE_SCHEDULED,
    value: 50,
    name: 'Intake Scheduled',
  },
  SITE_INTAKE_ATTENDED: {
    event: SiteFunnelEvents.PROTOCOL_INTAKE_ATTENDED,
    value: 200,
    name: 'Intake Attended',
  },
  SITE_MEMBERSHIP_ACTIVATED: {
    event: SiteFunnelEvents.MEMBERSHIP_ACTIVATED,
    value: 1000,
    name: 'Membership Activated',
  },
  SITE_CANDIDATE_ENROLLED: {
    event: SiteFunnelEvents.CANDIDATE_ENROLLED,
    value: 2000,
    name: 'Candidate Enrolled',
  },
} as const;

// ============================================================================
// TRACKING HELPERS
// ============================================================================

export function getUTMParams(): Partial<PatientFunnelProperties | SiteFunnelProperties> {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
    referrer: document.referrer || undefined,
    page_url: window.location.href,
    page_title: document.title,
  };
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('funnel_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('funnel_session_id', sessionId);
  }
  return sessionId;
}

export function calculateLeadScore(properties: PatientFunnelProperties): number {
  let score = 0;
  
  // Base score for completing quiz
  if (properties.email) score += 30;
  if (properties.phone) score += 20;
  
  // Distance bonus (closer is better)
  if (properties.distance) {
    if (properties.distance < 25) score += 20;
    else if (properties.distance < 50) score += 10;
    else if (properties.distance < 100) score += 5;
  }
  
  // Stage bonus (earlier stage typically better for trials)
  if (properties.stage) {
    if (properties.stage.includes('I') || properties.stage.includes('II')) score += 15;
    else if (properties.stage.includes('III')) score += 10;
    else if (properties.stage.includes('IV')) score += 5;
  }
  
  // Biomarker bonus (targeted therapies)
  if (properties.biomarkers && properties.biomarkers !== 'none') score += 10;
  
  return Math.min(score, 100); // Cap at 100
}

// ============================================================================
// A/B TEST VARIANTS
// ============================================================================

export const ABTestVariants = {
  HEADLINES: {
    A: 'Do you qualify for a clinical trial near you?',
    B: 'Find breakthrough treatments before FDA approval',
    C: 'Get access to tomorrow\'s cancer treatments today',
  },
  CTA_BUTTONS: {
    A: 'Check Eligibility',
    B: 'Start Free Check',
    C: 'Find Trials Now',
  },
  URGENCY: {
    A: 'countdown_timer',
    B: 'limited_spots',
    C: 'no_urgency',
  },
} as const;

export function getRandomVariant<T extends Record<string, any>>(variants: T): keyof T {
  const keys = Object.keys(variants);
  return keys[Math.floor(Math.random() * keys.length)] as keyof T;
}
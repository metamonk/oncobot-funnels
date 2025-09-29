import { pgTable, text, timestamp, boolean, varchar, integer, json } from 'drizzle-orm/pg-core';
import { generateId } from 'ai';
import { InferSelectModel } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Membership bookings table
export const membershipBookings = pgTable('membership_bookings', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  companyName: text('companyName').notNull(),
  contactName: text('contactName').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  indication: text('indication').notNull(),
  siteLocation: text('siteLocation').notNull(),
  monthlyVolume: text('monthlyVolume'),
  notes: text('notes'),
  selectedTime: text('selectedTime').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Admin tables for managing ad headlines and campaigns
export const indications = pgTable('indications', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isActive: boolean('isActive').notNull().default(true),
  isFeatured: boolean('isFeatured').notNull().default(false),
  heroHeadline: text('heroHeadline'),
  heroSubheadline: text('heroSubheadline'),

  // Supporting text rotation (for hero section)
  supportingText: json('supportingText').$type<string[]>(),

  // Value propositions
  valueProps: json('valueProps').$type<string[]>(),

  // CTA configuration
  ctaPrimaryText: text('ctaPrimaryText'),
  ctaSecondaryText: text('ctaSecondaryText'),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const landingPages = pgTable('landing_pages', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  path: text('path').notNull(),
  slug: varchar('slug', { length: 100 }).unique(),
  indicationId: text('indicationId').references(() => indications.id, { onDelete: 'set null' }),
  description: text('description'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const adHeadlines = pgTable('ad_headlines', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  indicationId: text('indicationId').references(() => indications.id, { onDelete: 'cascade' }),

  // Google Ads text components
  headline: varchar('headline', { length: 30 }).notNull(),
  longHeadline: varchar('longHeadline', { length: 90 }).notNull(),
  description: varchar('description', { length: 90 }).notNull(),

  // Configuration
  landingPageId: text('landingPageId').references(() => landingPages.id, { onDelete: 'set null' }),
  category: text('category'), // 'problem-agitate', 'curiosity-gap', 'social-proof'
  isActive: boolean('isActive').notNull().default(false),

  // Performance metrics
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Ad campaigns table (Performance Max structure)
export const adCampaigns = pgTable('ad_campaigns', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: varchar('name', { length: 100 }).notNull(),
  indicationId: text('indicationId').references(() => indications.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  utmCampaign: varchar('utmCampaign', { length: 100 }),

  // Performance Max campaign settings
  campaignType: varchar('campaignType', { length: 50 }).notNull().default('performance_max'),
  budget: integer('budget'), // Daily budget in cents
  targetRoas: integer('targetRoas'), // Target ROAS percentage (e.g., 400 = 400%)

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Asset Groups table (replaces individual ads)
export const assetGroups = pgTable('asset_groups', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  campaignId: text('campaignId').notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),

  // Asset group theme and targeting
  theme: varchar('theme', { length: 100 }), // e.g., 'Eligibility', 'Benefits', 'Urgency'
  audienceSignal: json('audienceSignal').$type<{
    keywords?: string[];
    demographics?: {
      ageRange?: string;
      gender?: string;
      location?: string[];
    };
    interests?: string[];
  }>(),

  // Final URL (can have multiple in real Performance Max, simplified to one)
  landingPageId: text('landingPageId').references(() => landingPages.id, { onDelete: 'set null' }),
  finalUrl: text('finalUrl'),

  isActive: boolean('isActive').notNull().default(true),

  // Performance metrics
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  cost: integer('cost').notNull().default(0), // In cents

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Asset Group Assets table (links assets to groups)
export const assetGroupAssets = pgTable('asset_group_assets', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  assetGroupId: text('assetGroupId').notNull().references(() => assetGroups.id, { onDelete: 'cascade' }),

  // Asset type and reference
  assetType: varchar('assetType', { length: 50 }).notNull(), // 'headline', 'long_headline', 'description', 'image', 'logo', 'video'
  assetId: text('assetId'), // References appropriate table based on type

  // For text assets, we can store directly
  textContent: text('textContent'),

  // Asset performance
  performanceRating: varchar('performanceRating', { length: 20 }), // 'learning', 'low', 'good', 'best'
  impressions: integer('impressions').notNull().default(0),

  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Note: ads table has been removed in favor of assetGroups and assetGroupAssets

// Quiz submissions table - minimal storage for local analytics and automation
export const quizSubmissions = pgTable('quiz_submissions', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),

  // Contact identification
  email: text('email').notNull(), // Indexed for quick lookups
  fullName: text('fullName').notNull(),
  phone: text('phone'),

  // Core quiz data
  cancerType: text('cancerType').notNull(),
  indication: text('indication'), // lung, breast, prostate, etc.
  indicationName: text('indicationName'), // Human-readable name
  stage: text('stage').notNull(),
  zipCode: text('zipCode').notNull(),

  // Additional medical information
  biomarkers: text('biomarkers'), // Store as text, parse as needed
  priorTherapy: text('priorTherapy'),
  forWhom: text('forWhom'), // self, relative, friend, caregiver

  // Consent and preferences
  hasConsent: boolean('hasConsent').notNull().default(true),
  preferredTime: text('preferredTime'),

  // CRM sync tracking
  ghlContactId: text('ghlContactId'), // GoHighLevel contact ID
  ghlOpportunityId: text('ghlOpportunityId'), // GoHighLevel opportunity ID
  syncedToCrm: boolean('syncedToCrm').notNull().default(false),
  syncError: text('syncError'), // Store any sync error messages
  syncedAt: timestamp('syncedAt'),

  // Tracking metadata
  sessionId: text('sessionId'),
  landingPageId: text('landingPageId'),
  quizVersion: integer('quizVersion').notNull().default(1),

  // UTM parameters for attribution
  utmSource: text('utmSource'),
  utmMedium: text('utmMedium'),
  utmCampaign: text('utmCampaign'),
  utmTerm: text('utmTerm'),
  utmContent: text('utmContent'),
  gclid: text('gclid'), // Google Click ID for conversion tracking

  // Timestamps
  completedAt: timestamp('completedAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;
export type MembershipBooking = InferSelectModel<typeof membershipBookings>;
export type Indication = InferSelectModel<typeof indications>;
export type LandingPage = InferSelectModel<typeof landingPages>;
export type AdHeadline = InferSelectModel<typeof adHeadlines>;
export type AdCampaign = InferSelectModel<typeof adCampaigns>;
export type AssetGroup = InferSelectModel<typeof assetGroups>;
export type AssetGroupAsset = InferSelectModel<typeof assetGroupAssets>;
export type QuizSubmission = InferSelectModel<typeof quizSubmissions>;


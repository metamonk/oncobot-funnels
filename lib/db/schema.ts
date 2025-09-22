import { pgTable, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
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
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const landingPages = pgTable('landing_pages', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  path: text('path').notNull(),
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

export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;
export type MembershipBooking = InferSelectModel<typeof membershipBookings>;
export type Indication = InferSelectModel<typeof indications>;
export type LandingPage = InferSelectModel<typeof landingPages>;
export type AdHeadline = InferSelectModel<typeof adHeadlines>;


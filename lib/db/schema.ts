import { pgTable, text, timestamp, boolean, json, varchar, integer, date } from 'drizzle-orm/pg-core';
import { generateId } from 'ai';
import { InferSelectModel, relations } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
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

export const chat = pgTable('chat', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId()),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull().default('New Chat'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export const message = pgTable('message', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId()),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // user, assistant, or tool
  parts: json('parts').notNull(), // Store parts as JSON in the database
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const stream = pgTable('stream', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});


// Custom instructions table
export const customInstructions = pgTable('custom_instructions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;
export type Chat = InferSelectModel<typeof chat>;
export type Message = InferSelectModel<typeof message>;
export type Stream = InferSelectModel<typeof stream>;
export type CustomInstructions = InferSelectModel<typeof customInstructions>;

// Health profile table
export const healthProfile = pgTable('health_profile', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  cancerRegion: text('cancerRegion'),
  primarySite: text('primarySite'),
  cancerType: text('cancerType'),
  diseaseStage: text('diseaseStage'),
  dateOfBirth: date('dateOfBirth'),
  treatmentHistory: json('treatmentHistory'),
  molecularMarkers: json('molecularMarkers'),
  performanceStatus: text('performanceStatus'),
  complications: json('complications'),
  completedAt: timestamp('completedAt'),
  questionnaireVersion: integer('questionnaireVersion').notNull().default(1),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// User health profile mapping table
export const userHealthProfile = pgTable('user_health_profile', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  healthProfileId: text('healthProfileId')
    .notNull()
    .references(() => healthProfile.id, { onDelete: 'cascade' }),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Health profile responses table for individual answers
export const healthProfileResponse = pgTable('health_profile_response', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  healthProfileId: text('healthProfileId')
    .notNull()
    .references(() => healthProfile.id, { onDelete: 'cascade' }),
  questionId: text('questionId').notNull(),
  response: json('response').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Relations
export const userHealthProfileRelations = relations(userHealthProfile, ({ one }) => ({
  user: one(user, {
    fields: [userHealthProfile.userId],
    references: [user.id],
  }),
  healthProfile: one(healthProfile, {
    fields: [userHealthProfile.healthProfileId],
    references: [healthProfile.id],
  }),
}));

export const healthProfileRelations = relations(healthProfile, ({ many }) => ({
  userHealthProfiles: many(userHealthProfile),
  responses: many(healthProfileResponse),
}));

export const healthProfileResponseRelations = relations(healthProfileResponse, ({ one }) => ({
  healthProfile: one(healthProfile, {
    fields: [healthProfileResponse.healthProfileId],
    references: [healthProfile.id],
  }),
}));

export type HealthProfile = InferSelectModel<typeof healthProfile>;
export type UserHealthProfile = InferSelectModel<typeof userHealthProfile>;
export type HealthProfileResponse = InferSelectModel<typeof healthProfileResponse>;

// Saved trials table
export const savedTrials = pgTable('saved_trials', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  nctId: text('nctId').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  tags: json('tags').$type<string[]>().default([]),
  searchContext: json('searchContext').$type<{
    query?: string;
    healthProfileSnapshot?: any;
    location?: string;
  }>(),
  trialSnapshot: json('trialSnapshot').notNull(), // Cached trial data
  lastUpdated: timestamp('lastUpdated').notNull().defaultNow(),
  savedAt: timestamp('savedAt').notNull().defaultNow(),
  notificationSettings: json('notificationSettings').$type<{
    statusChange?: boolean;
    enrollmentClosing?: boolean;
  }>().default({}),
});

// Relations for saved trials
export const savedTrialsRelations = relations(savedTrials, ({ one }) => ({
  user: one(user, {
    fields: [savedTrials.userId],
    references: [user.id],
  }),
}));

export type SavedTrial = InferSelectModel<typeof savedTrials>;

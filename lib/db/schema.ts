import { pgTable, text, timestamp, boolean, json, varchar, integer, date } from 'drizzle-orm/pg-core';
import { generateId } from 'ai';
import { InferSelectModel, relations } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  email_verified: boolean('email_verified').notNull(),
  image: text('image'),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expires_at: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  account_id: text('account_id').notNull(),
  provider_id: text('provider_id').notNull(),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  id_token: text('id_token'),
  access_token_expires_at: timestamp('access_token_expires_at'),
  refresh_token_expires_at: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  created_at: timestamp('created_at').notNull(),
  updated_at: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});

export const chat = pgTable('chat', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId()),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull().default('New Chat'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export const message = pgTable('message', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateId()),
  chat_id: text('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // user, assistant, or tool
  parts: json('parts').notNull(), // Store parts as JSON in the database
  attachments: json('attachments').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const stream = pgTable('stream', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  chat_id: text('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').notNull().defaultNow(),
});


// Custom instructions table
export const customInstructions = pgTable('custom_instructions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
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
  cancer_region: text('cancer_region'),
  primary_site: text('primary_site'),
  cancer_type: text('cancer_type'),
  disease_stage: text('disease_stage'),
  date_of_birth: date('date_of_birth'),
  treatment_history: json('treatment_history'),
  molecular_markers: json('molecular_markers'),
  performance_status: text('performance_status'),
  complications: json('complications'),
  completed_at: timestamp('completed_at'),
  questionnaire_version: integer('questionnaire_version').notNull().default(1),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// User health profile mapping table
export const userHealthProfile = pgTable('user_health_profile', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  health_profile_id: text('health_profile_id')
    .notNull()
    .references(() => healthProfile.id, { onDelete: 'cascade' }),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Health profile responses table for individual answers
export const healthProfileResponse = pgTable('health_profile_response', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId()),
  health_profile_id: text('health_profile_id')
    .notNull()
    .references(() => healthProfile.id, { onDelete: 'cascade' }),
  question_id: text('question_id').notNull(),
  response: json('response').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const userHealthProfileRelations = relations(userHealthProfile, ({ one }) => ({
  user: one(user, {
    fields: [userHealthProfile.user_id],
    references: [user.id],
  }),
  healthProfile: one(healthProfile, {
    fields: [userHealthProfile.health_profile_id],
    references: [healthProfile.id],
  }),
}));

export const healthProfileRelations = relations(healthProfile, ({ many }) => ({
  userHealthProfiles: many(userHealthProfile),
  responses: many(healthProfileResponse),
}));

export const healthProfileResponseRelations = relations(healthProfileResponse, ({ one }) => ({
  healthProfile: one(healthProfile, {
    fields: [healthProfileResponse.health_profile_id],
    references: [healthProfile.id],
  }),
}));

export type HealthProfile = InferSelectModel<typeof healthProfile>;
export type UserHealthProfile = InferSelectModel<typeof userHealthProfile>;
export type HealthProfileResponse = InferSelectModel<typeof healthProfileResponse>;

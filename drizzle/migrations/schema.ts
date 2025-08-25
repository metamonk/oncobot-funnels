import { pgTable, text, timestamp, unique, boolean, foreignKey, varchar, json, integer, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const chat = pgTable("chat", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	title: text().default('New Chat').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	visibility: varchar().default('private').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_userId_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const stream = pgTable("stream", {
	id: text().primaryKey().notNull(),
	chatId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "stream_chatId_chat_id_fk"
		}).onDelete("cascade"),
]);

export const message = pgTable("message", {
	id: text().primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	role: text().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "message_chat_id_chat_id_fk"
		}).onDelete("cascade"),
]);

export const customInstructions = pgTable("custom_instructions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "custom_instructions_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const healthProfile = pgTable("health_profile", {
	id: text().primaryKey().notNull(),
	cancerRegion: text("cancer_region"),
	primarySite: text("primary_site"),
	cancerType: text("cancer_type"),
	diseaseStage: text("disease_stage"),
	treatmentHistory: json("treatment_history"),
	molecularMarkers: json("molecular_markers"),
	performanceStatus: text("performance_status"),
	complications: json(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	questionnaireVersion: integer("questionnaire_version").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	dateOfBirth: date("date_of_birth"),
});

export const healthProfileResponse = pgTable("health_profile_response", {
	id: text().primaryKey().notNull(),
	healthProfileId: text("health_profile_id").notNull(),
	questionId: text("question_id").notNull(),
	response: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.healthProfileId],
			foreignColumns: [healthProfile.id],
			name: "health_profile_response_health_profile_id_health_profile_id_fk"
		}).onDelete("cascade"),
]);

export const userHealthProfile = pgTable("user_health_profile", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	healthProfileId: text("health_profile_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_health_profile_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.healthProfileId],
			foreignColumns: [healthProfile.id],
			name: "user_health_profile_health_profile_id_health_profile_id_fk"
		}).onDelete("cascade"),
]);

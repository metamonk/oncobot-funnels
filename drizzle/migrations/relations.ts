import { relations } from "drizzle-orm/relations";
import { user, account, chat, session, stream, message, customInstructions, healthProfile, healthProfileResponse, userHealthProfile } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	chats: many(chat),
	sessions: many(session),
	customInstructions: many(customInstructions),
	userHealthProfiles: many(userHealthProfile),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	streams: many(stream),
	messages: many(message),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const streamRelations = relations(stream, ({one}) => ({
	chat: one(chat, {
		fields: [stream.chatId],
		references: [chat.id]
	}),
}));

export const messageRelations = relations(message, ({one}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
}));

export const customInstructionsRelations = relations(customInstructions, ({one}) => ({
	user: one(user, {
		fields: [customInstructions.userId],
		references: [user.id]
	}),
}));

export const healthProfileResponseRelations = relations(healthProfileResponse, ({one}) => ({
	healthProfile: one(healthProfile, {
		fields: [healthProfileResponse.healthProfileId],
		references: [healthProfile.id]
	}),
}));

export const healthProfileRelations = relations(healthProfile, ({many}) => ({
	healthProfileResponses: many(healthProfileResponse),
	userHealthProfiles: many(userHealthProfile),
}));

export const userHealthProfileRelations = relations(userHealthProfile, ({one}) => ({
	user: one(user, {
		fields: [userHealthProfile.userId],
		references: [user.id]
	}),
	healthProfile: one(healthProfile, {
		fields: [userHealthProfile.healthProfileId],
		references: [healthProfile.id]
	}),
}));
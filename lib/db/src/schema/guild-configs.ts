import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guildConfigsTable = pgTable("guild_configs", {
  guildId: text("guild_id").primaryKey(),
  welcomeChannelId: text("welcome_channel_id"),
  welcomeMessage: text("welcome_message").default("Welcome to the server, {user}!"),
  welcomeBannerUrl: text("welcome_banner_url"),
  logChannelId: text("log_channel_id"),
  autoRoleId: text("auto_role_id"),
  badWordsEnabled: boolean("bad_words_enabled").notNull().default(false),
  badWordsList: text("bad_words_list").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGuildConfigSchema = createInsertSchema(guildConfigsTable).omit({ createdAt: true, updatedAt: true });
export type InsertGuildConfig = z.infer<typeof insertGuildConfigSchema>;
export type GuildConfig = typeof guildConfigsTable.$inferSelect;

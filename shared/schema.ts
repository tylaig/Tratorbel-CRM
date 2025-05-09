import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema from original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pipeline Stages
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).pick({
  name: true,
  order: true,
});

export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;

// Deals
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  contactName: text("contact_name"),
  contactId: text("contact_id"),
  chatwootContactId: text("chatwoot_contact_id"),
  stageId: integer("stage_id").notNull(),
  value: doublePrecision("value").default(0),
  status: text("status").default("in_progress"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDealSchema = createInsertSchema(deals).pick({
  name: true,
  companyName: true,
  contactName: true,
  contactId: true,
  chatwootContactId: true,
  stageId: true,
  value: true,
  status: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Quote Items
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).pick({
  dealId: true,
  description: true,
  quantity: true,
  unitPrice: true,
});

export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

// Stage History
export const stageHistory = pgTable("stage_history", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  stageId: integer("stage_id").notNull(),
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"),
});

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  chatwootApiKey: text("chatwoot_api_key"),
  chatwootUrl: text("chatwoot_url"),
  accountId: text("account_id"),
  lastSyncAt: timestamp("last_sync_at"),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  chatwootApiKey: true,
  chatwootUrl: true,
  accountId: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

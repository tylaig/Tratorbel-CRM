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
  isDefault: boolean("is_default").default(false), // Indica se o estágio é padrão para contatos importados
  isHidden: boolean("is_hidden").default(false),   // Indica se o estágio está oculto na visualização normal
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).pick({
  name: true,
  order: true,
  isDefault: true,
  isHidden: true,
});

export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;

// Deals - Negócios
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  contactName: text("contact_name"),
  contactId: text("contact_id"),
  chatwootContactId: text("chatwoot_contact_id"),
  stageId: integer("stage_id").notNull(),
  value: doublePrecision("value").default(0),
  quoteValue: doublePrecision("quote_value").default(0),
  status: text("status").default("in_progress"),
  // Novos campos para clientes
  isCompany: boolean("is_company").default(false),
  cnpj: text("cnpj"),
  corporateName: text("corporate_name"), // razão social
  cpf: text("cpf"),
  stateRegistration: text("state_registration"), // inscrição estadual
  clientCode: text("client_code"), // código do cliente
  email: text("email"),
  phone: text("phone"),
  // Endereço
  address: text("address"),
  addressNumber: text("address_number"),
  addressComplement: text("address_complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  // Status da venda
  saleStatus: text("sale_status").default("negotiation"), // negotiation, won, lost
  lostReason: text("lost_reason"), // motivo principal da perda
  lostNotes: text("lost_notes"), // observações sobre a perda
  machineCount: integer("machine_count").default(0), // contador de máquinas do cliente
  // Campos de rastreamento
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
  quoteValue: true,
  status: true,
  // Novos campos do cliente
  isCompany: true,
  cnpj: true,
  corporateName: true,
  cpf: true,
  stateRegistration: true,
  clientCode: true,
  email: true,
  phone: true,
  // Endereço
  address: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  zipCode: true,
  // Status da venda
  saleStatus: true,
  lostReason: true,
  lostNotes: true,
  machineCount: true,
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

// Máquinas do cliente
export const clientMachines = pgTable("client_machines", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(), // marca
  model: text("model").notNull(),
  year: text("year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientMachineSchema = createInsertSchema(clientMachines).pick({
  dealId: true,
  name: true,
  brand: true,
  model: true,
  year: true,
});

export type InsertClientMachine = z.infer<typeof insertClientMachineSchema>;
export type ClientMachine = typeof clientMachines.$inferSelect;

// Motivos de perda de negócio
export const lossReasons = pgTable("loss_reasons", {
  id: serial("id").primaryKey(),
  reason: text("reason").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLossReasonSchema = createInsertSchema(lossReasons).pick({
  reason: true,
  active: true,
});

export type InsertLossReason = z.infer<typeof insertLossReasonSchema>;
export type LossReason = typeof lossReasons.$inferSelect;

// Lead Activities
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  activityType: text("activity_type").notNull(), // proposal_created, email_sent, call_made, meeting_scheduled, etc.
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by"), // Nome de quem criou a atividade
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).pick({
  dealId: true,
  activityType: true,
  description: true,
  createdBy: true,
});

export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;

// Marcas de máquinas
export const machineBrands = pgTable("machine_brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMachineBrandSchema = createInsertSchema(machineBrands).pick({
  name: true,
  description: true,
  active: true,
});

export type InsertMachineBrand = z.infer<typeof insertMachineBrandSchema>;
export type MachineBrand = typeof machineBrands.$inferSelect;

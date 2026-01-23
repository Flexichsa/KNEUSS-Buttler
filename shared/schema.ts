import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const WidgetSizeModeSchema = z.enum(["icon", "compact", "standard", "large"]);
export type WidgetSizeMode = z.infer<typeof WidgetSizeModeSchema>;

export const WidgetLayoutSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  sizeMode: WidgetSizeModeSchema.optional(),
});

export const WidgetInstanceSchema = z.object({
  id: z.string(),
  type: z.string(),
});

export const WeatherSettingsSchema = z.object({
  city: z.string().default("Berlin"),
  showWind: z.boolean().default(true),
  showHumidity: z.boolean().default(true),
  showPressure: z.boolean().default(true),
  showHourlyForecast: z.boolean().default(true),
});

export const CryptoSettingsSchema = z.object({
  coins: z.array(z.string()).default(["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "ripple"]),
  show1h: z.boolean().default(true),
  show24h: z.boolean().default(true),
  show7d: z.boolean().default(true),
  showChart: z.boolean().default(true),
});

export const ClockSettingsSchema = z.object({
  mode: z.enum(["digital", "analog"]).default("digital"),
  showSeconds: z.boolean().default(true),
  showDate: z.boolean().default(true),
  use24Hour: z.boolean().default(true),
});

export const SingleCoinSettingsSchema = z.object({
  coinId: z.string().default("bitcoin"),
  showChart: z.boolean().default(true),
  showChange: z.boolean().default(true),
  variant: z.enum(["compact", "detailed", "chart"]).default("detailed"),
});

export const CalendarSettingsSchema = z.object({
  viewMode: z.enum(["day", "week", "month", "list"]).default("list"),
  showTime: z.boolean().default(true),
  maxEvents: z.number().default(10),
});

export const WeblinkSettingsSchema = z.object({
  url: z.string().default(""),
  title: z.string().optional(),
  backgroundColor: z.string().default("#3b82f6"),
});

export const DashboardTabSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  layouts: z.array(WidgetLayoutSchema),
  enabledWidgets: z.array(z.string()),
  widgetInstances: z.array(WidgetInstanceSchema).optional(),
  widgetSettings: z.record(z.string(), z.any()).optional(),
});

export const DashboardConfigSchema = z.object({
  layouts: z.array(WidgetLayoutSchema),
  enabledWidgets: z.array(z.string()),
  widgetInstances: z.array(WidgetInstanceSchema).optional(),
  widgetSettings: z.record(z.string(), z.any()).optional(),
  tabs: z.array(DashboardTabSchema).optional(),
  activeTabId: z.string().optional(),
});

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
export type WidgetInstance = z.infer<typeof WidgetInstanceSchema>;
export type WeatherSettings = z.infer<typeof WeatherSettingsSchema>;
export type CryptoSettings = z.infer<typeof CryptoSettingsSchema>;
export type ClockSettings = z.infer<typeof ClockSettingsSchema>;
export type SingleCoinSettings = z.infer<typeof SingleCoinSettingsSchema>;
export type CalendarSettings = z.infer<typeof CalendarSettingsSchema>;
export type WeblinkSettings = z.infer<typeof WeblinkSettingsSchema>;
export type DashboardTab = z.infer<typeof DashboardTabSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;


export const oauthTokens = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  provider: text("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  email: text("email"),
  displayName: text("display_name"),
});

export const oauthStates = pgTable("oauth_states", {
  id: serial("id").primaryKey(),
  state: varchar("state").notNull().unique(),
  sessionId: varchar("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todoLabels = pgTable("todo_labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6b7280"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todoSections = pgTable("todo_sections", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  priority: integer("priority").notNull().default(4),
  dueDate: timestamp("due_date"),
  dueTime: text("due_time"),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'set null' }),
  sectionId: integer("section_id").references(() => todoSections.id, { onDelete: 'set null' }),
  parentTodoId: integer("parent_todo_id"),
  orderIndex: integer("order_index").notNull().default(0),
  labelIds: integer("label_ids").array(),
  recurringPattern: text("recurring_pattern"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull().unique(),
  config: jsonb("config").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  parentProjectId: integer("parent_project_id"),
  orderIndex: integer("order_index").notNull().default(0),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("in_progress"),
  assignee: text("assignee"),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date"),
  phase: text("phase"),
  costs: text("costs"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
});

export const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
});

export const insertTodoLabelSchema = createInsertSchema(todoLabels).omit({
  id: true,
  createdAt: true,
});

export const insertTodoSectionSchema = createInsertSchema(todoSections).omit({
  id: true,
  createdAt: true,
});

export const insertTodoSchema = createInsertSchema(todos, {
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (!val) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }),
  labelIds: z.array(z.number()).optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const updateTodoSchema = z.object({
  completed: z.boolean().optional(),
  text: z.string().optional(),
  description: z.string().optional().nullable(),
  priority: z.number().min(1).max(4).optional(),
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }),
  dueTime: z.string().optional().nullable(),
  projectId: z.number().optional().nullable(),
  sectionId: z.number().optional().nullable(),
  parentTodoId: z.number().optional().nullable(),
  orderIndex: z.number().optional(),
  labelIds: z.array(z.number()).optional().nullable(),
  recurringPattern: z.string().optional().nullable(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTodoLabel = z.infer<typeof insertTodoLabelSchema>;
export type TodoLabel = typeof todoLabels.$inferSelect;

export type InsertTodoSection = z.infer<typeof insertTodoSectionSchema>;
export type TodoSection = typeof todoSections.$inferSelect;

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;
export type TodoWithSubtasks = Todo & { subtasks: Todo[] };

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const insertOAuthTokenSchema = createInsertSchema(oauthTokens).omit({
  id: true,
});

export const insertOAuthStateSchema = createInsertSchema(oauthStates).omit({
  id: true,
  createdAt: true,
});

export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;

export type InsertOAuthState = z.infer<typeof insertOAuthStateSchema>;
export type OAuthState = typeof oauthStates.$inferSelect;

export type DashboardLayout = typeof dashboardLayouts.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const todoAttachments = pgTable("todo_attachments", {
  id: serial("id").primaryKey(),
  todoId: integer("todo_id").notNull().references(() => todos.id, { onDelete: 'cascade' }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTodoAttachmentSchema = createInsertSchema(todoAttachments).omit({
  id: true,
  createdAt: true,
});

export type InsertTodoAttachment = z.infer<typeof insertTodoAttachmentSchema>;
export type TodoAttachment = typeof todoAttachments.$inferSelect;

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("company"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactPersons = pgTable("contact_persons", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactPersonSchema = createInsertSchema(contactPersons).omit({
  id: true,
  createdAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertContactPerson = z.infer<typeof insertContactPersonSchema>;
export type ContactPerson = typeof contactPersons.$inferSelect;

export type ContactWithPersons = Contact & { persons: ContactPerson[] };

export const passwords = pgTable("passwords", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  username: text("username"),
  encryptedPassword: text("encrypted_password").notNull(),
  url: text("url"),
  notes: text("notes"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPasswordSchema = createInsertSchema(passwords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPassword = z.infer<typeof insertPasswordSchema>;
export type Password = typeof passwords.$inferSelect;

export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename"),
  rawContent: text("raw_content").notNull(),
  rowCount: integer("row_count"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertCsvUploadSchema = createInsertSchema(csvUploads).omit({
  id: true,
  uploadedAt: true,
});

export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;
export type CsvUpload = typeof csvUploads.$inferSelect;

// CSB ERP Knowledge Base - Kategorien
export const guideCategories = pgTable("guide_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("folder"),
  color: text("color").default("#3b82f6"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CSB ERP Knowledge Base - Anleitungen
export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => guideCategories.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CSB ERP Knowledge Base - Anleitung Schritte
export const guideSteps = pgTable("guide_steps", {
  id: serial("id").primaryKey(),
  guideId: integer("guide_id").notNull().references(() => guides.id, { onDelete: 'cascade' }),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuideCategorySchema = createInsertSchema(guideCategories).omit({
  id: true,
  createdAt: true,
});

export const insertGuideSchema = createInsertSchema(guides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuideStepSchema = createInsertSchema(guideSteps).omit({
  id: true,
  createdAt: true,
});

export type InsertGuideCategory = z.infer<typeof insertGuideCategorySchema>;
export type GuideCategory = typeof guideCategories.$inferSelect;

export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guides.$inferSelect;

export type InsertGuideStep = z.infer<typeof insertGuideStepSchema>;
export type GuideStep = typeof guideSteps.$inferSelect;

export type GuideWithSteps = Guide & { steps: GuideStep[]; category?: GuideCategory };

// ERP-Programme Kategorien
export const erpCategories = pgTable("erp_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ERP-Programme
export const erpPrograms = pgTable("erp_programs", {
  id: serial("id").primaryKey(),
  programNumber: text("program_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  instruction: text("instruction"),
  instructionUrl: text("instruction_url"),
  categoryId: integer("category_id").references(() => erpCategories.id, { onDelete: 'set null' }),
  lastModifiedBy: text("last_modified_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ERP-Programme Änderungshistorie
export const erpProgramHistory = pgTable("erp_program_history", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => erpPrograms.id, { onDelete: 'cascade' }),
  changedBy: text("changed_by").notNull(),
  changeType: text("change_type").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

export const insertErpCategorySchema = createInsertSchema(erpCategories).omit({
  id: true,
  createdAt: true,
});

export const insertErpProgramSchema = createInsertSchema(erpPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateErpProgramSchema = z.object({
  programNumber: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  instruction: z.string().optional().nullable(),
  instructionUrl: z.string().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  lastModifiedBy: z.string().optional().nullable(),
});

export const insertErpProgramHistorySchema = createInsertSchema(erpProgramHistory).omit({
  id: true,
  changedAt: true,
});

export type InsertErpCategory = z.infer<typeof insertErpCategorySchema>;
export type ErpCategory = typeof erpCategories.$inferSelect;

export type InsertErpProgram = z.infer<typeof insertErpProgramSchema>;
export type ErpProgram = typeof erpPrograms.$inferSelect;

export type InsertErpProgramHistory = z.infer<typeof insertErpProgramHistorySchema>;
export type ErpProgramHistory = typeof erpProgramHistory.$inferSelect;

export type ErpProgramWithCategory = ErpProgram & { category?: ErpCategory };

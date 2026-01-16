import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

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

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
});

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

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTodoSchema = createInsertSchema(todos, {
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (!val) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }),
}).omit({
  id: true,
  createdAt: true,
});

export const updateTodoSchema = z.object({
  completed: z.boolean().optional(),
  text: z.string().optional(),
  dueDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;

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

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("company"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
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

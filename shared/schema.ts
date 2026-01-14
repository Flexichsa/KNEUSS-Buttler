import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const WidgetLayoutSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
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

export const DashboardConfigSchema = z.object({
  layouts: z.array(WidgetLayoutSchema),
  enabledWidgets: z.array(z.string()),
  widgetInstances: z.array(WidgetInstanceSchema).optional(),
  widgetSettings: z.record(z.string(), z.any()).optional(),
});

export type WidgetLayout = z.infer<typeof WidgetLayoutSchema>;
export type WidgetInstance = z.infer<typeof WidgetInstanceSchema>;
export type WeatherSettings = z.infer<typeof WeatherSettingsSchema>;
export type CryptoSettings = z.infer<typeof CryptoSettingsSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTodoSchema = createInsertSchema(todos).omit({
  id: true,
  createdAt: true,
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

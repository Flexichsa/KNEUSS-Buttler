import { db } from "../db";
import { users, todos, notes, oauthTokens, oauthStates, dashboardLayouts, projects, type User, type InsertUser, type Todo, type InsertTodo, type Note, type InsertNote, type OAuthToken, type InsertOAuthToken, type OAuthState, type InsertOAuthState, type DashboardConfig, type DashboardLayout, type Project, type InsertProject } from "@shared/schema";
import { eq, and, lt, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // OAuth Tokens
  getOAuthToken(sessionId: string, provider: string): Promise<OAuthToken | undefined>;
  upsertOAuthToken(token: InsertOAuthToken): Promise<OAuthToken>;
  deleteOAuthToken(sessionId: string, provider: string): Promise<void>;
  
  // OAuth States (for CSRF protection)
  createOAuthState(state: InsertOAuthState): Promise<OAuthState>;
  getAndDeleteOAuthState(state: string): Promise<OAuthState | undefined>;
  cleanupExpiredOAuthStates(): Promise<void>;
  
  // Todos
  getTodos(): Promise<Todo[]>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, completed: boolean): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<void>;
  
  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<void>;
  
  // Dashboard Layouts
  getDashboardLayout(sessionId: string): Promise<DashboardConfig | undefined>;
  saveDashboardLayout(sessionId: string, config: DashboardConfig): Promise<void>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // OAuth Tokens
  async getOAuthToken(sessionId: string, provider: string): Promise<OAuthToken | undefined> {
    const [token] = await db.select().from(oauthTokens).where(
      and(eq(oauthTokens.sessionId, sessionId), eq(oauthTokens.provider, provider))
    );
    return token;
  }

  async upsertOAuthToken(token: InsertOAuthToken): Promise<OAuthToken> {
    const existing = await this.getOAuthToken(token.sessionId, token.provider);
    if (existing) {
      const [updated] = await db
        .update(oauthTokens)
        .set(token)
        .where(eq(oauthTokens.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newToken] = await db.insert(oauthTokens).values(token).returning();
      return newToken;
    }
  }

  async deleteOAuthToken(sessionId: string, provider: string): Promise<void> {
    await db.delete(oauthTokens).where(
      and(eq(oauthTokens.sessionId, sessionId), eq(oauthTokens.provider, provider))
    );
  }

  // OAuth States (for CSRF protection)
  async createOAuthState(state: InsertOAuthState): Promise<OAuthState> {
    const [newState] = await db.insert(oauthStates).values(state).returning();
    return newState;
  }

  async getAndDeleteOAuthState(state: string): Promise<OAuthState | undefined> {
    const [found] = await db.select().from(oauthStates).where(eq(oauthStates.state, state));
    if (found) {
      await db.delete(oauthStates).where(eq(oauthStates.id, found.id));
    }
    return found;
  }

  async cleanupExpiredOAuthStates(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await db.delete(oauthStates).where(lt(oauthStates.createdAt, tenMinutesAgo));
  }

  // Todos
  async getTodos(): Promise<Todo[]> {
    return db.select().from(todos).orderBy(todos.createdAt);
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const [newTodo] = await db.insert(todos).values(todo).returning();
    return newTodo;
  }

  async updateTodo(id: number, completed: boolean): Promise<Todo | undefined> {
    const [updated] = await db
      .update(todos)
      .set({ completed })
      .where(eq(todos.id, id))
      .returning();
    return updated;
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return db.select().from(notes).orderBy(notes.updatedAt);
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const [updated] = await db
      .update(notes)
      .set({ ...noteUpdate, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updated;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Dashboard Layouts
  async getDashboardLayout(sessionId: string): Promise<DashboardConfig | undefined> {
    const [layout] = await db.select().from(dashboardLayouts).where(eq(dashboardLayouts.sessionId, sessionId));
    if (layout) {
      return layout.config as DashboardConfig;
    }
    return undefined;
  }

  async saveDashboardLayout(sessionId: string, config: DashboardConfig): Promise<void> {
    const existing = await db.select().from(dashboardLayouts).where(eq(dashboardLayouts.sessionId, sessionId));
    if (existing.length > 0) {
      await db.update(dashboardLayouts)
        .set({ config, updatedAt: new Date() })
        .where(eq(dashboardLayouts.sessionId, sessionId));
    } else {
      await db.insert(dashboardLayouts).values({ sessionId, config });
    }
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...projectUpdate, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}

export const storage = new DatabaseStorage();

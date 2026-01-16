import { db } from "../db";
import { users, todos, notes, oauthTokens, oauthStates, dashboardLayouts, projects, contacts, contactPersons, type User, type InsertUser, type Todo, type InsertTodo, type Note, type InsertNote, type OAuthToken, type InsertOAuthToken, type OAuthState, type InsertOAuthState, type DashboardConfig, type DashboardLayout, type Project, type InsertProject, type Contact, type InsertContact, type ContactPerson, type InsertContactPerson, type ContactWithPersons } from "@shared/schema";
import { eq, and, lt, desc, isNull } from "drizzle-orm";

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
  updateTodo(id: number, updates: Partial<Pick<Todo, 'completed' | 'dueDate' | 'text'>>): Promise<Todo | undefined>;
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
  getParentProjects(): Promise<Project[]>;
  getSubprojects(parentId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  reorderProjects(orderings: { id: number; orderIndex: number; parentProjectId: number | null }[]): Promise<void>;
  
  // Contacts
  getContacts(): Promise<ContactWithPersons[]>;
  getContact(id: number): Promise<ContactWithPersons | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<void>;
  
  // Contact Persons
  getContactPersons(contactId: number): Promise<ContactPerson[]>;
  createContactPerson(person: InsertContactPerson): Promise<ContactPerson>;
  updateContactPerson(id: number, person: Partial<InsertContactPerson>): Promise<ContactPerson | undefined>;
  deleteContactPerson(id: number): Promise<void>;
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

  async updateTodo(id: number, updates: Partial<Pick<Todo, 'completed' | 'dueDate' | 'text'>>): Promise<Todo | undefined> {
    const [updated] = await db
      .update(todos)
      .set(updates)
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
    return db.select().from(projects).orderBy(projects.orderIndex, projects.name);
  }

  async getParentProjects(): Promise<Project[]> {
    return db.select().from(projects).where(isNull(projects.parentProjectId)).orderBy(projects.orderIndex, projects.name);
  }

  async getSubprojects(parentId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.parentProjectId, parentId)).orderBy(projects.orderIndex, projects.name);
  }

  async reorderProjects(orderings: { id: number; orderIndex: number; parentProjectId: number | null }[]): Promise<void> {
    for (const item of orderings) {
      await db.update(projects)
        .set({ orderIndex: item.orderIndex, parentProjectId: item.parentProjectId, updatedAt: new Date() })
        .where(eq(projects.id, item.id));
    }
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
    await db.delete(projects).where(eq(projects.parentProjectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Contacts
  async getContacts(): Promise<ContactWithPersons[]> {
    const allContacts = await db.select().from(contacts).orderBy(desc(contacts.updatedAt));
    const allPersons = await db.select().from(contactPersons);
    
    return allContacts.map(contact => ({
      ...contact,
      persons: allPersons.filter(p => p.contactId === contact.id)
    }));
  }

  async getContact(id: number): Promise<ContactWithPersons | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    if (!contact) return undefined;
    
    const persons = await db.select().from(contactPersons).where(eq(contactPersons.contactId, id));
    return { ...contact, persons };
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contactUpdate: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set({ ...contactUpdate, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Contact Persons
  async getContactPersons(contactId: number): Promise<ContactPerson[]> {
    return db.select().from(contactPersons).where(eq(contactPersons.contactId, contactId));
  }

  async createContactPerson(person: InsertContactPerson): Promise<ContactPerson> {
    const [newPerson] = await db.insert(contactPersons).values(person).returning();
    return newPerson;
  }

  async updateContactPerson(id: number, personUpdate: Partial<InsertContactPerson>): Promise<ContactPerson | undefined> {
    const [updated] = await db
      .update(contactPersons)
      .set(personUpdate)
      .where(eq(contactPersons.id, id))
      .returning();
    return updated;
  }

  async deleteContactPerson(id: number): Promise<void> {
    await db.delete(contactPersons).where(eq(contactPersons.id, id));
  }
}

export const storage = new DatabaseStorage();

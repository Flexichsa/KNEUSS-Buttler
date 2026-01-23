import { db } from "../db";
import { users, todos, notes, oauthTokens, oauthStates, dashboardLayouts, projects, contacts, contactPersons, todoLabels, todoSections, todoAttachments, passwords, csvUploads, guideCategories, guides, guideSteps, erpCategories, erpPrograms, erpProgramHistory, type User, type InsertUser, type Todo, type InsertTodo, type Note, type InsertNote, type OAuthToken, type InsertOAuthToken, type OAuthState, type InsertOAuthState, type DashboardConfig, type DashboardLayout, type Project, type InsertProject, type Contact, type InsertContact, type ContactPerson, type InsertContactPerson, type ContactWithPersons, type TodoLabel, type InsertTodoLabel, type TodoSection, type InsertTodoSection, type TodoWithSubtasks, type TodoAttachment, type InsertTodoAttachment, type Password, type InsertPassword, type CsvUpload, type InsertCsvUpload, type GuideCategory, type InsertGuideCategory, type Guide, type InsertGuide, type GuideStep, type InsertGuideStep, type GuideWithSteps, type ErpCategory, type InsertErpCategory, type ErpProgram, type InsertErpProgram, type ErpProgramHistory, type InsertErpProgramHistory, type ErpProgramWithCategory } from "@shared/schema";
import { eq, and, lt, desc, isNull, asc, gte, lte, ilike, or } from "drizzle-orm";

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
  
  // Todo Labels
  getTodoLabels(): Promise<TodoLabel[]>;
  createTodoLabel(label: InsertTodoLabel): Promise<TodoLabel>;
  updateTodoLabel(id: number, updates: Partial<InsertTodoLabel>): Promise<TodoLabel | undefined>;
  deleteTodoLabel(id: number): Promise<void>;
  
  // Todo Sections
  getTodoSections(projectId?: number | null): Promise<TodoSection[]>;
  createTodoSection(section: InsertTodoSection): Promise<TodoSection>;
  updateTodoSection(id: number, updates: Partial<InsertTodoSection>): Promise<TodoSection | undefined>;
  deleteTodoSection(id: number): Promise<void>;
  
  // Todos
  getTodos(): Promise<Todo[]>;
  getTodosWithSubtasks(): Promise<TodoWithSubtasks[]>;
  getTodosByProject(projectId: number | null): Promise<Todo[]>;
  getTodosForToday(): Promise<Todo[]>;
  getUpcomingTodos(days: number): Promise<Todo[]>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<void>;
  reorderTodos(orderings: { id: number; orderIndex: number }[]): Promise<void>;
  
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
  
  // Todo Attachments
  getTodoAttachments(todoId: number): Promise<TodoAttachment[]>;
  createTodoAttachment(attachment: InsertTodoAttachment): Promise<TodoAttachment>;
  deleteTodoAttachment(id: number): Promise<TodoAttachment | undefined>;
  
  // Passwords
  getPasswords(userId: string): Promise<Password[]>;
  getPassword(id: number, userId: string): Promise<Password | undefined>;
  createPassword(password: InsertPassword): Promise<Password>;
  updatePassword(id: number, userId: string, password: Partial<InsertPassword>): Promise<Password | undefined>;
  deletePassword(id: number, userId: string): Promise<void>;
  
  // CSV Uploads
  getLatestCsvUpload(): Promise<CsvUpload | undefined>;
  getCsvUploads(limit?: number): Promise<CsvUpload[]>;
  createCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload>;
  
  // Guide Categories
  getGuideCategories(): Promise<GuideCategory[]>;
  getGuideCategory(id: number): Promise<GuideCategory | undefined>;
  createGuideCategory(category: InsertGuideCategory): Promise<GuideCategory>;
  updateGuideCategory(id: number, category: Partial<InsertGuideCategory>): Promise<GuideCategory | undefined>;
  deleteGuideCategory(id: number): Promise<void>;
  
  // Guides
  getGuides(): Promise<GuideWithSteps[]>;
  getGuidesByCategory(categoryId: number | null): Promise<GuideWithSteps[]>;
  searchGuides(query: string): Promise<GuideWithSteps[]>;
  getGuide(id: number): Promise<GuideWithSteps | undefined>;
  createGuide(guide: InsertGuide): Promise<Guide>;
  updateGuide(id: number, guide: Partial<InsertGuide>): Promise<Guide | undefined>;
  deleteGuide(id: number): Promise<void>;
  
  // Guide Steps
  getGuideSteps(guideId: number): Promise<GuideStep[]>;
  createGuideStep(step: InsertGuideStep): Promise<GuideStep>;
  updateGuideStep(id: number, step: Partial<InsertGuideStep>): Promise<GuideStep | undefined>;
  deleteGuideStep(id: number): Promise<void>;
  
  // ERP Categories
  getErpCategories(): Promise<ErpCategory[]>;
  getErpCategory(id: number): Promise<ErpCategory | undefined>;
  createErpCategory(category: InsertErpCategory): Promise<ErpCategory>;
  updateErpCategory(id: number, category: Partial<InsertErpCategory>): Promise<ErpCategory | undefined>;
  deleteErpCategory(id: number): Promise<void>;
  
  // ERP Programs
  getErpPrograms(): Promise<ErpProgramWithCategory[]>;
  getErpProgramsByCategory(categoryId: number | null): Promise<ErpProgramWithCategory[]>;
  searchErpPrograms(query: string): Promise<ErpProgramWithCategory[]>;
  getErpProgram(id: number): Promise<ErpProgramWithCategory | undefined>;
  getErpProgramByNumber(programNumber: string): Promise<ErpProgramWithCategory | undefined>;
  createErpProgram(program: InsertErpProgram, changedBy: string): Promise<ErpProgram>;
  updateErpProgram(id: number, program: Partial<InsertErpProgram>, changedBy: string): Promise<ErpProgram | undefined>;
  deleteErpProgram(id: number, changedBy: string): Promise<void>;
  
  // ERP Program History
  getErpProgramHistory(programId: number): Promise<ErpProgramHistory[]>;
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

  // Todo Labels
  async getTodoLabels(): Promise<TodoLabel[]> {
    return db.select().from(todoLabels).orderBy(todoLabels.name);
  }

  async createTodoLabel(label: InsertTodoLabel): Promise<TodoLabel> {
    const [newLabel] = await db.insert(todoLabels).values(label).returning();
    return newLabel;
  }

  async updateTodoLabel(id: number, updates: Partial<InsertTodoLabel>): Promise<TodoLabel | undefined> {
    const [updated] = await db.update(todoLabels).set(updates).where(eq(todoLabels.id, id)).returning();
    return updated;
  }

  async deleteTodoLabel(id: number): Promise<void> {
    await db.delete(todoLabels).where(eq(todoLabels.id, id));
  }

  // Todo Sections
  async getTodoSections(projectId?: number | null): Promise<TodoSection[]> {
    if (projectId !== undefined) {
      if (projectId === null) {
        return db.select().from(todoSections).where(isNull(todoSections.projectId)).orderBy(todoSections.orderIndex);
      }
      return db.select().from(todoSections).where(eq(todoSections.projectId, projectId)).orderBy(todoSections.orderIndex);
    }
    return db.select().from(todoSections).orderBy(todoSections.orderIndex);
  }

  async createTodoSection(section: InsertTodoSection): Promise<TodoSection> {
    const [newSection] = await db.insert(todoSections).values(section).returning();
    return newSection;
  }

  async updateTodoSection(id: number, updates: Partial<InsertTodoSection>): Promise<TodoSection | undefined> {
    const [updated] = await db.update(todoSections).set(updates).where(eq(todoSections.id, id)).returning();
    return updated;
  }

  async deleteTodoSection(id: number): Promise<void> {
    await db.delete(todoSections).where(eq(todoSections.id, id));
  }

  // Todos
  async getTodos(): Promise<Todo[]> {
    return db.select().from(todos).orderBy(asc(todos.orderIndex), asc(todos.createdAt));
  }

  async getTodosWithSubtasks(): Promise<TodoWithSubtasks[]> {
    const allTodos = await db.select().from(todos).orderBy(asc(todos.orderIndex), asc(todos.createdAt));
    const parentTodos = allTodos.filter(t => !t.parentTodoId);
    return parentTodos.map(parent => ({
      ...parent,
      subtasks: allTodos.filter(t => t.parentTodoId === parent.id)
    }));
  }

  async getTodosByProject(projectId: number | null): Promise<Todo[]> {
    if (projectId === null) {
      return db.select().from(todos).where(isNull(todos.projectId)).orderBy(asc(todos.orderIndex));
    }
    return db.select().from(todos).where(eq(todos.projectId, projectId)).orderBy(asc(todos.orderIndex));
  }

  async getTodosForToday(): Promise<Todo[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return db.select().from(todos).where(
      and(
        gte(todos.dueDate, today),
        lt(todos.dueDate, tomorrow),
        eq(todos.completed, false)
      )
    ).orderBy(asc(todos.priority), asc(todos.orderIndex));
  }

  async getUpcomingTodos(days: number): Promise<Todo[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    return db.select().from(todos).where(
      and(
        gte(todos.dueDate, today),
        lte(todos.dueDate, endDate),
        eq(todos.completed, false)
      )
    ).orderBy(asc(todos.dueDate), asc(todos.priority));
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const [newTodo] = await db.insert(todos).values(todo).returning();
    return newTodo;
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | undefined> {
    const updateData: any = { ...updates };
    if (updates.completed === true && !updates.completedAt) {
      updateData.completedAt = new Date();
    } else if (updates.completed === false) {
      updateData.completedAt = null;
    }
    const [updated] = await db.update(todos).set(updateData).where(eq(todos.id, id)).returning();
    return updated;
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.parentTodoId, id));
    await db.delete(todos).where(eq(todos.id, id));
  }

  async reorderTodos(orderings: { id: number; orderIndex: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of orderings) {
        await tx.update(todos).set({ orderIndex: item.orderIndex }).where(eq(todos.id, item.id));
      }
    });
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
    await db.transaction(async (tx) => {
      for (const item of orderings) {
        await tx.update(projects)
          .set({ orderIndex: item.orderIndex, parentProjectId: item.parentProjectId, updatedAt: new Date() })
          .where(eq(projects.id, item.id));
      }
    });
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

  // Todo Attachments
  async getTodoAttachments(todoId: number): Promise<TodoAttachment[]> {
    return db.select().from(todoAttachments).where(eq(todoAttachments.todoId, todoId)).orderBy(todoAttachments.createdAt);
  }

  async createTodoAttachment(attachment: InsertTodoAttachment): Promise<TodoAttachment> {
    const [newAttachment] = await db.insert(todoAttachments).values(attachment).returning();
    return newAttachment;
  }

  async deleteTodoAttachment(id: number): Promise<TodoAttachment | undefined> {
    const [deleted] = await db.delete(todoAttachments).where(eq(todoAttachments.id, id)).returning();
    return deleted;
  }

  // Passwords
  async getPasswords(userId: string): Promise<Password[]> {
    return db.select().from(passwords).where(eq(passwords.userId, userId)).orderBy(desc(passwords.updatedAt));
  }

  async getPassword(id: number, userId: string): Promise<Password | undefined> {
    const [password] = await db.select().from(passwords).where(
      and(eq(passwords.id, id), eq(passwords.userId, userId))
    );
    return password;
  }

  async createPassword(password: InsertPassword): Promise<Password> {
    const [newPassword] = await db.insert(passwords).values(password).returning();
    return newPassword;
  }

  async updatePassword(id: number, userId: string, passwordUpdate: Partial<InsertPassword>): Promise<Password | undefined> {
    const [updated] = await db
      .update(passwords)
      .set({ ...passwordUpdate, updatedAt: new Date() })
      .where(and(eq(passwords.id, id), eq(passwords.userId, userId)))
      .returning();
    return updated;
  }

  async deletePassword(id: number, userId: string): Promise<void> {
    await db.delete(passwords).where(and(eq(passwords.id, id), eq(passwords.userId, userId)));
  }

  // CSV Uploads
  async getLatestCsvUpload(): Promise<CsvUpload | undefined> {
    const [upload] = await db.select().from(csvUploads).orderBy(desc(csvUploads.uploadedAt)).limit(1);
    return upload;
  }

  async getCsvUploads(limit: number = 10): Promise<CsvUpload[]> {
    return db.select().from(csvUploads).orderBy(desc(csvUploads.uploadedAt)).limit(limit);
  }

  async createCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload> {
    const [newUpload] = await db.insert(csvUploads).values(upload).returning();
    return newUpload;
  }

  // Guide Categories
  async getGuideCategories(): Promise<GuideCategory[]> {
    return db.select().from(guideCategories).orderBy(asc(guideCategories.orderIndex), asc(guideCategories.name));
  }

  async getGuideCategory(id: number): Promise<GuideCategory | undefined> {
    const [category] = await db.select().from(guideCategories).where(eq(guideCategories.id, id));
    return category;
  }

  async createGuideCategory(category: InsertGuideCategory): Promise<GuideCategory> {
    const [newCategory] = await db.insert(guideCategories).values(category).returning();
    return newCategory;
  }

  async updateGuideCategory(id: number, categoryUpdate: Partial<InsertGuideCategory>): Promise<GuideCategory | undefined> {
    const [updated] = await db.update(guideCategories).set(categoryUpdate).where(eq(guideCategories.id, id)).returning();
    return updated;
  }

  async deleteGuideCategory(id: number): Promise<void> {
    await db.delete(guideCategories).where(eq(guideCategories.id, id));
  }

  // Guides
  private async enrichGuidesWithSteps(guidesList: Guide[]): Promise<GuideWithSteps[]> {
    if (guidesList.length === 0) return [];
    
    const allSteps = await db.select().from(guideSteps).orderBy(asc(guideSteps.stepNumber));
    const allCategories = await db.select().from(guideCategories);
    
    return guidesList.map(guide => ({
      ...guide,
      steps: allSteps.filter(s => s.guideId === guide.id),
      category: allCategories.find(c => c.id === guide.categoryId)
    }));
  }

  async getGuides(): Promise<GuideWithSteps[]> {
    const allGuides = await db.select().from(guides).orderBy(desc(guides.updatedAt));
    return this.enrichGuidesWithSteps(allGuides);
  }

  async getGuidesByCategory(categoryId: number | null): Promise<GuideWithSteps[]> {
    let guidesList: Guide[];
    if (categoryId === null) {
      guidesList = await db.select().from(guides).where(isNull(guides.categoryId)).orderBy(desc(guides.updatedAt));
    } else {
      guidesList = await db.select().from(guides).where(eq(guides.categoryId, categoryId)).orderBy(desc(guides.updatedAt));
    }
    return this.enrichGuidesWithSteps(guidesList);
  }

  async searchGuides(query: string): Promise<GuideWithSteps[]> {
    const searchTerm = `%${query}%`;
    const guidesList = await db.select().from(guides).where(
      or(
        ilike(guides.title, searchTerm),
        ilike(guides.description, searchTerm),
        ilike(guides.content, searchTerm)
      )
    ).orderBy(desc(guides.updatedAt));
    return this.enrichGuidesWithSteps(guidesList);
  }

  async getGuide(id: number): Promise<GuideWithSteps | undefined> {
    const [guide] = await db.select().from(guides).where(eq(guides.id, id));
    if (!guide) return undefined;
    
    const steps = await db.select().from(guideSteps).where(eq(guideSteps.guideId, id)).orderBy(asc(guideSteps.stepNumber));
    const category = guide.categoryId ? await this.getGuideCategory(guide.categoryId) : undefined;
    
    return { ...guide, steps, category };
  }

  async createGuide(guide: InsertGuide): Promise<Guide> {
    const [newGuide] = await db.insert(guides).values(guide).returning();
    return newGuide;
  }

  async updateGuide(id: number, guideUpdate: Partial<InsertGuide>): Promise<Guide | undefined> {
    const [updated] = await db.update(guides).set({ ...guideUpdate, updatedAt: new Date() }).where(eq(guides.id, id)).returning();
    return updated;
  }

  async deleteGuide(id: number): Promise<void> {
    await db.delete(guides).where(eq(guides.id, id));
  }

  // Guide Steps
  async getGuideSteps(guideId: number): Promise<GuideStep[]> {
    return db.select().from(guideSteps).where(eq(guideSteps.guideId, guideId)).orderBy(asc(guideSteps.stepNumber));
  }

  async createGuideStep(step: InsertGuideStep): Promise<GuideStep> {
    const [newStep] = await db.insert(guideSteps).values(step).returning();
    return newStep;
  }

  async updateGuideStep(id: number, stepUpdate: Partial<InsertGuideStep>): Promise<GuideStep | undefined> {
    const [updated] = await db.update(guideSteps).set(stepUpdate).where(eq(guideSteps.id, id)).returning();
    return updated;
  }

  async deleteGuideStep(id: number): Promise<void> {
    await db.delete(guideSteps).where(eq(guideSteps.id, id));
  }

  // ERP Categories
  async getErpCategories(): Promise<ErpCategory[]> {
    return db.select().from(erpCategories).orderBy(asc(erpCategories.orderIndex), asc(erpCategories.name));
  }

  async getErpCategory(id: number): Promise<ErpCategory | undefined> {
    const [category] = await db.select().from(erpCategories).where(eq(erpCategories.id, id));
    return category;
  }

  async createErpCategory(category: InsertErpCategory): Promise<ErpCategory> {
    const [newCategory] = await db.insert(erpCategories).values(category).returning();
    return newCategory;
  }

  async updateErpCategory(id: number, categoryUpdate: Partial<InsertErpCategory>): Promise<ErpCategory | undefined> {
    const [updated] = await db.update(erpCategories).set(categoryUpdate).where(eq(erpCategories.id, id)).returning();
    return updated;
  }

  async deleteErpCategory(id: number): Promise<void> {
    await db.delete(erpCategories).where(eq(erpCategories.id, id));
  }

  // ERP Programs
  private async enrichErpProgramsWithCategory(programs: ErpProgram[]): Promise<ErpProgramWithCategory[]> {
    if (programs.length === 0) return [];
    
    const allCategories = await db.select().from(erpCategories);
    
    return programs.map(program => ({
      ...program,
      category: allCategories.find(c => c.id === program.categoryId)
    }));
  }

  async getErpPrograms(): Promise<ErpProgramWithCategory[]> {
    const allPrograms = await db.select().from(erpPrograms).orderBy(asc(erpPrograms.programNumber));
    return this.enrichErpProgramsWithCategory(allPrograms);
  }

  async getErpProgramsByCategory(categoryId: number | null): Promise<ErpProgramWithCategory[]> {
    let programsList: ErpProgram[];
    if (categoryId === null) {
      programsList = await db.select().from(erpPrograms).where(isNull(erpPrograms.categoryId)).orderBy(asc(erpPrograms.programNumber));
    } else {
      programsList = await db.select().from(erpPrograms).where(eq(erpPrograms.categoryId, categoryId)).orderBy(asc(erpPrograms.programNumber));
    }
    return this.enrichErpProgramsWithCategory(programsList);
  }

  async searchErpPrograms(query: string): Promise<ErpProgramWithCategory[]> {
    const searchPattern = `%${query}%`;
    const results = await db.select().from(erpPrograms).where(
      or(
        ilike(erpPrograms.programNumber, searchPattern),
        ilike(erpPrograms.title, searchPattern),
        ilike(erpPrograms.description, searchPattern)
      )
    ).orderBy(asc(erpPrograms.programNumber));
    return this.enrichErpProgramsWithCategory(results);
  }

  async getErpProgram(id: number): Promise<ErpProgramWithCategory | undefined> {
    const [program] = await db.select().from(erpPrograms).where(eq(erpPrograms.id, id));
    if (!program) return undefined;
    
    const enriched = await this.enrichErpProgramsWithCategory([program]);
    return enriched[0];
  }

  async getErpProgramByNumber(programNumber: string): Promise<ErpProgramWithCategory | undefined> {
    const [program] = await db.select().from(erpPrograms).where(eq(erpPrograms.programNumber, programNumber));
    if (!program) return undefined;
    
    const enriched = await this.enrichErpProgramsWithCategory([program]);
    return enriched[0];
  }

  async createErpProgram(program: InsertErpProgram, changedBy: string): Promise<ErpProgram> {
    const [newProgram] = await db.insert(erpPrograms).values({
      ...program,
      lastModifiedBy: changedBy
    }).returning();
    
    await db.insert(erpProgramHistory).values({
      programId: newProgram.id,
      changedBy,
      changeType: 'created',
      newValues: newProgram
    });
    
    return newProgram;
  }

  async updateErpProgram(id: number, programUpdate: Partial<InsertErpProgram>, changedBy: string): Promise<ErpProgram | undefined> {
    const [oldProgram] = await db.select().from(erpPrograms).where(eq(erpPrograms.id, id));
    if (!oldProgram) return undefined;
    
    const [updated] = await db
      .update(erpPrograms)
      .set({ ...programUpdate, lastModifiedBy: changedBy, updatedAt: new Date() })
      .where(eq(erpPrograms.id, id))
      .returning();
    
    await db.insert(erpProgramHistory).values({
      programId: id,
      changedBy,
      changeType: 'updated',
      oldValues: oldProgram,
      newValues: updated
    });
    
    return updated;
  }

  async deleteErpProgram(id: number, changedBy: string): Promise<void> {
    const [oldProgram] = await db.select().from(erpPrograms).where(eq(erpPrograms.id, id));
    if (oldProgram) {
      await db.insert(erpProgramHistory).values({
        programId: id,
        changedBy,
        changeType: 'deleted',
        oldValues: oldProgram
      });
    }
    await db.delete(erpPrograms).where(eq(erpPrograms.id, id));
  }

  // ERP Program History
  async getErpProgramHistory(programId: number): Promise<ErpProgramHistory[]> {
    return db.select().from(erpProgramHistory).where(eq(erpProgramHistory.programId, programId)).orderBy(desc(erpProgramHistory.changedAt));
  }
}

export const storage = new DatabaseStorage();

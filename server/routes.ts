import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTodoSchema, updateTodoSchema, insertNoteSchema, insertProjectSchema, DashboardConfigSchema, insertContactSchema, insertContactPersonSchema, insertTodoLabelSchema, insertTodoSectionSchema, todoAttachments, insertPasswordSchema } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { getEmails, getTodayEvents, isOutlookConnected, getOutlookUserInfo, getEmailsForUser, getTodayEventsForUser, getOutlookUserInfoForUser, getTodoLists, getTodoTasks, getAllTodoTasks, isOneDriveConnected, getOneDriveFiles, getRecentOneDriveFiles } from "./outlook";
import { chatCompletion, summarizeEmails, analyzeDocument } from "./openai";
import { getAuthUrl, exchangeCodeForTokens, getMicrosoftUserInfo, isOAuthConfigured, createOAuthState, validateAndConsumeState } from "./oauth";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { isAsanaConnected, getAsanaUser, getWorkspaces, getProjects as getAsanaProjects, getAllTasks as getAsanaTasks } from "./asana";
import { findUserByEmail, findUserById, createUser, verifyPassword, getUserId, updateUserPassword, updateUserProfile, isAuthenticatedCustom } from "./customAuth";
import { loginSchema, registerSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const loadPdfParse = async () => {
  try {
    const mod = await import("pdf-parse");
    return (mod as any).PDFParse || null;
  } catch (e) {
    console.error("[PDF] Failed to load pdf-parse:", e);
    return null;
  }
};

let PDFParseClass: any = null;

const upload = multer({ 
  dest: "/tmp/uploads",
  limits: { fileSize: 10 * 1024 * 1024 }
});

const cryptoCache: Map<string, { data: any; timestamp: number }> = new Map();
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Replit Auth (must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Custom Login/Register Endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await findUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "E-Mail-Adresse wird bereits verwendet" });
      }
      
      const user = await createUser(data);
      
      req.login({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } as any, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Registrierung erfolgreich, aber Anmeldung fehlgeschlagen" });
        }
        res.status(201).json({ 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/login-password", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await findUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Ungültige E-Mail oder Passwort" });
      }
      
      const isValid = await verifyPassword(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Ungültige E-Mail oder Passwort" });
      }
      
      req.login({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } as any, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Anmeldung fehlgeschlagen" });
        }
        res.json({ 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Anmeldung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/change-password", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Nicht authentifiziert" });
      }
      
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen haben" });
      }
      
      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }
      
      if (user.passwordHash && currentPassword) {
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: "Aktuelles Passwort ist falsch" });
        }
      }
      
      await updateUserPassword(userId, newPassword);
      res.json({ success: true, message: "Passwort erfolgreich geändert" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Passwort ändern fehlgeschlagen" });
    }
  });

  app.patch("/api/auth/profile", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Nicht authentifiziert" });
      }
      
      const { firstName, lastName, email } = req.body;
      await updateUserProfile(userId, { firstName, lastName, email });
      
      const user = await findUserById(userId);
      res.json({ 
        id: user?.id, 
        email: user?.email, 
        firstName: user?.firstName, 
        lastName: user?.lastName 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Profil aktualisieren fehlgeschlagen" });
    }
  });

  // OAuth Configuration Status
  app.get("/api/auth/oauth-config", async (req, res) => {
    res.json({ configured: isOAuthConfigured() });
  });

  // Start OAuth flow
  app.get("/api/auth/outlook/login", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      
      if (!isOAuthConfigured()) {
        return res.status(503).json({ error: "OAuth not configured" });
      }
      
      const state = await createOAuthState(sessionId);
      const authUrl = getAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start OAuth" });
    }
  });

  // OAuth callback
  app.get("/api/auth/outlook/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      
      if (!code || !state) {
        return res.redirect("/settings?error=missing_params");
      }
      
      const sessionId = await validateAndConsumeState(state);
      if (!sessionId) {
        return res.redirect("/settings?error=invalid_state");
      }
      
      const tokens = await exchangeCodeForTokens(code);
      const userInfo = await getMicrosoftUserInfo(tokens.accessToken);
      
      await storage.upsertOAuthToken({
        sessionId,
        provider: "microsoft",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        email: userInfo.email,
        displayName: userInfo.displayName
      });
      
      res.redirect("/settings?success=connected");
    } catch (error: any) {
      console.error("[OAuth] Callback error:", error);
      res.redirect("/settings?error=auth_failed");
    }
  });

  // Disconnect user's Outlook
  app.post("/api/auth/outlook/disconnect", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      
      await storage.deleteOAuthToken(sessionId, "microsoft");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to disconnect" });
    }
  });

  // Get user's OAuth status
  app.get("/api/auth/outlook/status/:sessionId", async (req, res) => {
    try {
      const token = await storage.getOAuthToken(req.params.sessionId, "microsoft");
      if (token) {
        res.json({
          connected: true,
          email: token.email,
          displayName: token.displayName
        });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      res.json({ connected: false });
    }
  });
  
  // Outlook Integration Status (legacy - uses Replit connector)
  app.get("/api/outlook/status", async (req, res) => {
    try {
      const connected = await isOutlookConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Get Outlook Emails
  app.get("/api/outlook/emails", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const emails = await getEmails(limit);
      res.json(emails);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch emails" });
    }
  });

  // Get Today's Calendar Events
  app.get("/api/outlook/events/today", async (req, res) => {
    try {
      const events = await getTodayEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch events" });
    }
  });

  // Debug: Get connected user info
  app.get("/api/outlook/user", async (req, res) => {
    try {
      const userInfo = await getOutlookUserInfo();
      res.json(userInfo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch user info" });
    }
  });

  // Microsoft To Do - Get all lists
  app.get("/api/mstodo/lists", async (req, res) => {
    try {
      const lists = await getTodoLists();
      res.json(lists);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch To Do lists" });
    }
  });

  // Microsoft To Do - Get tasks from a specific list
  app.get("/api/mstodo/lists/:listId/tasks", async (req, res) => {
    try {
      const listId = req.params.listId;
      const includeCompleted = req.query.includeCompleted === 'true';
      const tasks = await getTodoTasks(listId, includeCompleted);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch tasks" });
    }
  });

  // Microsoft To Do - Get all tasks from all lists
  app.get("/api/mstodo/tasks", async (req, res) => {
    try {
      const includeCompleted = req.query.includeCompleted === 'true';
      const data = await getAllTodoTasks(includeCompleted);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch all tasks" });
    }
  });

  // OneDrive - Check connection status
  app.get("/api/onedrive/status", async (req, res) => {
    try {
      const connected = await isOneDriveConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // OneDrive - Get files from root or specific folder
  app.get("/api/onedrive/files", async (req, res) => {
    try {
      const folderId = req.query.folderId as string | undefined;
      const files = await getOneDriveFiles(folderId);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch files" });
    }
  });

  // OneDrive - Get recent files
  app.get("/api/onedrive/recent", async (req, res) => {
    try {
      const files = await getRecentOneDriveFiles();
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch recent files" });
    }
  });

  // AI Assistant Chat
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { messages, includeContext } = req.body;
      
      let context = '';
      if (includeContext) {
        try {
          const [emails, events] = await Promise.all([
            getEmails(5),
            getTodayEvents()
          ]);
          context = `Recent emails: ${emails.map(e => `"${e.subject}" from ${e.sender}`).join(', ')}. Today's events: ${events.map(e => e.subject).join(', ')}.`;
        } catch (error) {
          // Context fetching failed, continue without it
        }
      }
      
      const response = await chatCompletion(messages, context);
      res.json({ message: response });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get AI response" });
    }
  });

  // Email Summary
  app.get("/api/assistant/email-summary", async (req, res) => {
    try {
      const emails = await getEmails(10);
      const summary = await summarizeEmails(emails);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // Todo Labels CRUD
  app.get("/api/todo-labels", async (req, res) => {
    try {
      const labels = await storage.getTodoLabels();
      res.json(labels);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch labels" });
    }
  });

  app.post("/api/todo-labels", async (req, res) => {
    try {
      const validatedData = insertTodoLabelSchema.parse(req.body);
      const label = await storage.createTodoLabel(validatedData);
      res.status(201).json(label);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid label data" });
    }
  });

  app.patch("/api/todo-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTodoLabelSchema.partial().parse(req.body);
      const label = await storage.updateTodoLabel(id, validatedData);
      if (!label) {
        return res.status(404).json({ error: "Label not found" });
      }
      res.json(label);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update label" });
    }
  });

  app.delete("/api/todo-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTodoLabel(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete label" });
    }
  });

  // Todo Sections CRUD
  app.get("/api/todo-sections", async (req, res) => {
    try {
      const projectId = req.query.projectId !== undefined 
        ? req.query.projectId === 'null' ? null : parseInt(req.query.projectId as string)
        : undefined;
      const sections = await storage.getTodoSections(projectId);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch sections" });
    }
  });

  app.post("/api/todo-sections", async (req, res) => {
    try {
      const validatedData = insertTodoSectionSchema.parse(req.body);
      const section = await storage.createTodoSection(validatedData);
      res.status(201).json(section);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid section data" });
    }
  });

  app.patch("/api/todo-sections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTodoSectionSchema.partial().parse(req.body);
      const section = await storage.updateTodoSection(id, validatedData);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json(section);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update section" });
    }
  });

  app.delete("/api/todo-sections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTodoSection(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete section" });
    }
  });

  // Todos CRUD
  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos();
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch todos" });
    }
  });

  app.get("/api/todos/today", async (req, res) => {
    try {
      const todos = await storage.getTodosForToday();
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch today's todos" });
    }
  });

  app.get("/api/todos/upcoming", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const todos = await storage.getUpcomingTodos(days);
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch upcoming todos" });
    }
  });

  app.get("/api/todos/with-subtasks", async (req, res) => {
    try {
      const todos = await storage.getTodosWithSubtasks();
      res.json(todos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const validatedData = insertTodoSchema.parse(req.body);
      const todo = await storage.createTodo(validatedData);
      res.status(201).json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid todo data" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateTodoSchema.parse(req.body);
      
      const todo = await storage.updateTodo(id, validatedData);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update todo" });
    }
  });

  app.post("/api/todos/reorder", async (req, res) => {
    try {
      const orderings = req.body as { id: number; orderIndex: number }[];
      await storage.reorderTodos(orderings);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to reorder todos" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTodo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete todo" });
    }
  });

  // Todo Attachments
  const attachmentUpload = multer({ 
    dest: "uploads/attachments",
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Dateityp nicht erlaubt'));
      }
    }
  });

  // Ensure upload directory exists
  if (!fs.existsSync("uploads/attachments")) {
    fs.mkdirSync("uploads/attachments", { recursive: true });
  }

  app.get("/api/todos/:todoId/attachments", async (req, res) => {
    try {
      const todoId = parseInt(req.params.todoId);
      if (isNaN(todoId)) {
        return res.status(400).json({ error: "Invalid todo ID" });
      }
      const attachments = await storage.getTodoAttachments(todoId);
      res.json(attachments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch attachments" });
    }
  });

  app.post("/api/todos/:todoId/attachments", attachmentUpload.single('file'), async (req, res) => {
    try {
      const todoId = parseInt(req.params.todoId);
      if (isNaN(todoId)) {
        return res.status(400).json({ error: "Invalid todo ID" });
      }
      
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

      const attachment = await storage.createTodoAttachment({
        todoId,
        filename: file.filename,
        originalName: sanitizedOriginalName,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
      });

      res.status(201).json(attachment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to upload attachment" });
    }
  });

  app.get("/api/attachments/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [attachment] = await db.select().from(todoAttachments).where(eq(todoAttachments.id, id));
      
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      if (!fs.existsSync(attachment.path)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(attachment.path, attachment.originalName);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to download attachment" });
    }
  });

  app.get("/api/attachments/:id/preview", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [attachment] = await db.select().from(todoAttachments).where(eq(todoAttachments.id, id));
      
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      if (!fs.existsSync(attachment.path)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.sendFile(path.resolve(attachment.path));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to preview attachment" });
    }
  });

  app.delete("/api/attachments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTodoAttachment(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Delete the file from disk
      if (fs.existsSync(deleted.path)) {
        fs.unlinkSync(deleted.path);
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete attachment" });
    }
  });

  // Notes CRUD
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(id, validatedData);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNote(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete note" });
    }
  });

  // Dashboard Layout
  app.get("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      const config = await storage.getDashboardLayout(sessionId);
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch dashboard layout" });
    }
  });

  app.put("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      const validatedConfig = DashboardConfigSchema.parse(req.body);
      await storage.saveDashboardLayout(sessionId, validatedConfig);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to save dashboard layout" });
    }
  });

  // Projects (Status Reports)
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/parents", async (req, res) => {
    try {
      const projects = await storage.getParentProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch parent projects" });
    }
  });

  app.get("/api/projects/:id/subprojects", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subprojects = await storage.getSubprojects(id);
      res.json(subprojects);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch subprojects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete project" });
    }
  });

  app.post("/api/projects/reorder", async (req, res) => {
    try {
      const orderings = req.body as { id: number; orderIndex: number; parentProjectId: number | null }[];
      await storage.reorderProjects(orderings);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to reorder projects" });
    }
  });

  app.get("/api/projects/export/csv", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      const priorityLabels: Record<string, string> = {
        high: "Hoch",
        medium: "Mittel",
        low: "Niedrig"
      };
      
      const statusLabels: Record<string, string> = {
        in_progress: "In Bearbeitung",
        completed: "Abgeschlossen",
        blocked: "Blockiert",
        planned: "Geplant"
      };
      
      const phaseLabels: Record<string, string> = {
        planning: "Planung",
        development: "Entwicklung",
        testing: "Testing",
        review: "Review",
        deployment: "Deployment",
        maintenance: "Wartung"
      };
      
      const csvHeader = "Phase;Projekt;Beschreibung;Status;Kosten (CHF);Nächste Schritte;Priorität;Verantwortlich;Fortschritt;Fällig am;Erstellt am\n";
      const csvRows = projects.map(p => {
        const dueDate = p.dueDate ? new Date(p.dueDate).toLocaleDateString('de-DE') : "-";
        const createdAt = new Date(p.createdAt).toLocaleDateString('de-DE');
        const phase = p.phase ? (phaseLabels[p.phase] || p.phase) : "-";
        return `"${phase}";"${p.name}";"${p.description || ''}";"${statusLabels[p.status] || p.status}";"${p.costs || '-'}";"${p.nextSteps || '-'}";"${priorityLabels[p.priority] || p.priority}";"${p.assignee || '-'}";"${p.progress}%";"${dueDate}";"${createdAt}"`;
      }).join("\n");
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=status-bericht.csv");
      res.send("\uFEFF" + csvHeader + csvRows);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to export projects" });
    }
  });

  // Dashboard Layout
  app.get("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const config = await storage.getDashboardLayout(req.params.sessionId);
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch layout" });
    }
  });

  app.put("/api/dashboard/layout/:sessionId", async (req, res) => {
    try {
      const config = DashboardConfigSchema.parse(req.body);
      await storage.saveDashboardLayout(req.params.sessionId, config);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid layout data" });
    }
  });

  // Crypto Prices (CoinGecko API - no key required)
  app.get("/api/crypto", async (req, res) => {
    try {
      const now = Date.now();
      const cacheKey = "all_crypto";
      const cached = cryptoCache.get(cacheKey);
      
      if (cached && now - cached.timestamp < 60000) {
        return res.json({ ...cached.data, cached: true });
      }
      
      const coins = "bitcoin,ethereum,solana,dogecoin,cardano,ripple,vechain";
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coins}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d,30d,1y`
      );
      if (!response.ok) throw new Error("CoinGecko API error");
      const data = await response.json();
      
      const result = {
        coins: data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          price: coin.current_price,
          rank: coin.market_cap_rank,
          change1h: coin.price_change_percentage_1h_in_currency || 0,
          change24h: coin.price_change_percentage_24h || 0,
          change7d: coin.price_change_percentage_7d_in_currency || 0,
          change30d: coin.price_change_percentage_30d_in_currency || 0,
          change1y: coin.price_change_percentage_1y_in_currency || 0,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
          sparkline: coin.sparkline_in_7d?.price || [],
          high24h: coin.high_24h,
          low24h: coin.low_24h,
        })),
        timestamp: now
      };
      
      cryptoCache.set(cacheKey, { data: result, timestamp: now });
      res.json({ ...result, cached: false });
    } catch (error: any) {
      const cached = cryptoCache.get("all_crypto");
      if (cached) {
        return res.json({ ...cached.data, cached: true, stale: true });
      }
      res.status(500).json({ error: error.message || "Failed to fetch crypto prices" });
    }
  });

  // Bitcoin Price (legacy endpoint)
  app.get("/api/crypto/btc", async (req, res) => {
    try {
      const now = Date.now();
      const cached = cryptoCache.get("btc");
      if (cached && now - cached.timestamp < 60000) {
        return res.json({ price: cached.data.price, cached: true });
      }
      
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur");
      if (!response.ok) throw new Error("CoinGecko API error");
      const data = await response.json();
      
      cryptoCache.set("btc", { data: { price: data.bitcoin.eur, priceUsd: data.bitcoin.usd }, timestamp: now });
      
      res.json({ 
        price: data.bitcoin.eur, 
        priceUsd: data.bitcoin.usd,
        cached: false 
      });
    } catch (error: any) {
      const cached = cryptoCache.get("btc");
      if (cached) {
        return res.json({ price: cached.data.price, cached: true, stale: true });
      }
      res.status(500).json({ error: error.message || "Failed to fetch BTC price" });
    }
  });

  // Weather (Open-Meteo API - free, no API key required)
  app.get("/api/weather", async (req, res) => {
    try {
      const city = (req.query.city as string) || "Berlin";
      const cacheKey = city.toLowerCase();
      const cached = weatherCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < 300000) {
        return res.json({ ...cached.data, cached: true });
      }
      
      // First geocode the city name to coordinates
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
      );
      if (!geoResponse.ok) throw new Error("Geocoding API error");
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: "Stadt nicht gefunden" });
      }
      
      const location = geoData.results[0];
      const { latitude, longitude, name, country } = location;
      
      // Fetch weather data with hourly forecast, daily forecast and sunrise/sunset
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto&forecast_days=7`
      );
      
      if (!weatherResponse.ok) throw new Error("Weather API error");
      const weatherData = await weatherResponse.json();
      
      const current = weatherData.current;
      const hourly = weatherData.hourly;
      
      // Get weather description from WMO code
      const getWeatherDescription = (code: number): string => {
        const descriptions: Record<number, string> = {
          0: "Klar",
          1: "Überwiegend klar",
          2: "Teilweise bewölkt",
          3: "Bewölkt",
          45: "Nebel",
          48: "Reifnebel",
          51: "Leichter Nieselregen",
          53: "Nieselregen",
          55: "Starker Nieselregen",
          61: "Leichter Regen",
          63: "Regen",
          65: "Starkregen",
          71: "Leichter Schneefall",
          73: "Schneefall",
          75: "Starker Schneefall",
          80: "Regenschauer",
          81: "Starke Regenschauer",
          82: "Heftige Regenschauer",
          85: "Schneeschauer",
          86: "Starke Schneeschauer",
          95: "Gewitter",
          96: "Gewitter mit Hagel",
          99: "Schweres Gewitter mit Hagel"
        };
        return descriptions[code] || "Unbekannt";
      };
      
      // Get icon code based on WMO weather code
      const getIconCode = (code: number): string => {
        if (code === 0) return "01d";
        if (code <= 2) return "02d";
        if (code === 3) return "03d";
        if (code >= 45 && code <= 48) return "50d";
        if (code >= 51 && code <= 55) return "09d";
        if (code >= 61 && code <= 65) return "10d";
        if (code >= 71 && code <= 77) return "13d";
        if (code >= 80 && code <= 82) return "09d";
        if (code >= 85 && code <= 86) return "13d";
        if (code >= 95) return "11d";
        return "03d";
      };
      
      // Create hourly forecast (next 8 hours from current time)
      const nowTime = new Date();
      let startIndex = 0;
      
      // Find the index closest to current time in the hourly data
      for (let i = 0; i < hourly.time.length; i++) {
        const entryTime = new Date(hourly.time[i]);
        if (entryTime >= nowTime) {
          startIndex = i;
          break;
        }
      }
      
      const hourlyForecast = [];
      for (let i = 0; i < 8; i++) {
        const idx = startIndex + i;
        if (idx < hourly.time.length && hourly.temperature_2m[idx] !== undefined) {
          hourlyForecast.push({
            time: hourly.time[idx],
            hour: new Date(hourly.time[idx]).getHours(),
            temp: Math.round(hourly.temperature_2m[idx]),
            weatherCode: hourly.weather_code[idx],
            icon: getIconCode(hourly.weather_code[idx])
          });
        }
      }
      
      // Create daily forecast (5 days)
      const daily = weatherData.daily;
      const dailyForecast = [];
      for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        dailyForecast.push({
          date: daily.time[i],
          dayName: new Date(daily.time[i]).toLocaleDateString('de-DE', { weekday: 'short' }).toUpperCase(),
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          weatherCode: daily.weather_code[i],
          icon: getIconCode(daily.weather_code[i])
        });
      }
      
      // Get today's sunrise and sunset
      const sunrise = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null;
      const sunset = daily.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null;
      
      const weather = {
        city: name,
        country: country || "",
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        description: getWeatherDescription(current.weather_code),
        icon: getIconCode(current.weather_code),
        weatherCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        wind: (current.wind_speed_10m / 3.6).toFixed(1), // km/h to m/s
        pressure: Math.round(current.surface_pressure),
        hourlyForecast,
        dailyForecast,
        sunrise,
        sunset,
        configured: true
      };
      
      weatherCache.set(cacheKey, { data: weather, timestamp: now });
      res.json({ ...weather, cached: false });
    } catch (error: any) {
      console.error("[Weather] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch weather" });
    }
  });

  // Document Upload and Analysis
  const uploadedFiles = new Map<string, { originalName: string; filePath: string; suggestedName: string }>();
  
  app.post("/api/documents/analyze", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen" });
      }
      
      console.log(`[Documents] Analyzing file: ${file.originalname}`);
      
      let textContent = "";
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (ext === ".pdf") {
        if (!PDFParseClass) {
          PDFParseClass = await loadPdfParse();
        }
        if (!PDFParseClass) {
          return res.status(500).json({ error: "PDF-Verarbeitung nicht verfügbar" });
        }
        try {
          const dataBuffer = fs.readFileSync(file.path);
          const parser = new PDFParseClass({ data: dataBuffer });
          const result = await parser.getText();
          textContent = result?.text || "";
          await parser.destroy();
        } catch (pdfError: any) {
          console.error("[Documents] PDF parsing error:", pdfError);
          textContent = `Dateiname: ${file.originalname}`;
        }
      } else if (ext === ".txt") {
        textContent = fs.readFileSync(file.path, "utf-8");
      } else if (ext === ".doc" || ext === ".docx") {
        textContent = `Dateiname: ${file.originalname}`;
      } else {
        textContent = `Dateiname: ${file.originalname}`;
      }
      
      const analysis = await analyzeDocument(textContent, file.originalname);
      
      const fileId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newExt = path.extname(file.originalname);
      const suggestedNameWithExt = `${analysis.suggestedName}${newExt}`;
      
      uploadedFiles.set(fileId, {
        originalName: file.originalname,
        filePath: file.path,
        suggestedName: suggestedNameWithExt,
      });
      
      console.log(`[Documents] Analysis complete: ${suggestedNameWithExt}`);
      
      res.json({
        fileId,
        originalName: file.originalname,
        suggestedName: suggestedNameWithExt,
        companyName: analysis.companyName,
        documentType: analysis.documentType,
        date: analysis.date,
        downloadUrl: `/api/documents/download/${fileId}`,
      });
    } catch (error: any) {
      console.error("[Documents] Analysis error:", error);
      const errorMessage = typeof error?.message === 'string' && error.message.length < 200
        ? error.message
        : "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
      res.status(500).json({ error: errorMessage });
    }
  });
  
  app.get("/api/documents/download/:fileId", (req, res) => {
    const fileId = req.params.fileId;
    const fileInfo = uploadedFiles.get(fileId);
    
    if (!fileInfo) {
      return res.status(404).json({ error: "Datei nicht gefunden" });
    }
    
    if (!fs.existsSync(fileInfo.filePath)) {
      uploadedFiles.delete(fileId);
      return res.status(404).json({ error: "Datei nicht mehr verfügbar" });
    }
    
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileInfo.suggestedName)}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    
    const readStream = fs.createReadStream(fileInfo.filePath);
    readStream.pipe(res);
  });

  // Asana Integration
  app.get("/api/asana/status", async (req, res) => {
    try {
      const connected = await isAsanaConnected();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.get("/api/asana/user", async (req, res) => {
    try {
      const user = await getAsanaUser();
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch Asana user" });
    }
  });

  app.get("/api/asana/workspaces", async (req, res) => {
    try {
      const workspaces = await getWorkspaces();
      res.json(workspaces);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch workspaces" });
    }
  });

  app.get("/api/asana/projects", async (req, res) => {
    try {
      const workspaceGid = req.query.workspaceGid as string | undefined;
      const projects = await getAsanaProjects(workspaceGid);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch projects" });
    }
  });

  app.get("/api/asana/tasks", async (req, res) => {
    try {
      const workspaceGid = req.query.workspaceGid as string | undefined;
      const includeCompleted = req.query.includeCompleted === 'true';
      const tasks = await getAsanaTasks(workspaceGid, includeCompleted);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch tasks" });
    }
  });

  // Contacts CRUD
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContact(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete contact" });
    }
  });

  // Contact Persons CRUD
  app.get("/api/contacts/:contactId/persons", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const persons = await storage.getContactPersons(contactId);
      res.json(persons);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch contact persons" });
    }
  });

  app.post("/api/contacts/:contactId/persons", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const validatedData = insertContactPersonSchema.omit({ contactId: true }).parse(req.body);
      const person = await storage.createContactPerson({ ...validatedData, contactId });
      res.status(201).json(person);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create contact person" });
    }
  });

  app.patch("/api/contact-persons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactPersonSchema.omit({ contactId: true }).partial().parse(req.body);
      const person = await storage.updateContactPerson(id, validatedData);
      if (!person) {
        return res.status(404).json({ error: "Contact person not found" });
      }
      res.json(person);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update contact person" });
    }
  });

  app.delete("/api/contact-persons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContactPerson(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete contact person" });
    }
  });

  // Password Manager CRUD (requires authentication for user isolation)
  app.get("/api/passwords", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const passwords = await storage.getPasswords(userId);
      res.json(passwords);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch passwords" });
    }
  });

  app.get("/api/passwords/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const password = await storage.getPassword(id, userId);
      if (!password) {
        return res.status(404).json({ error: "Password not found" });
      }
      res.json(password);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch password" });
    }
  });

  app.get("/api/passwords/:id/decrypt", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const password = await storage.getPassword(id, userId);
      if (!password) {
        return res.status(404).json({ error: "Password not found" });
      }
      const { decryptPassword } = await import("./crypto");
      const decrypted = decryptPassword(password.encryptedPassword);
      res.json({ password: decrypted });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to decrypt password" });
    }
  });

  app.post("/api/passwords", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { password, ...rest } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      const { encryptPassword } = await import("./crypto");
      const encryptedPassword = encryptPassword(password);
      const validatedData = insertPasswordSchema.parse({ ...rest, userId, encryptedPassword });
      const created = await storage.createPassword(validatedData);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create password" });
    }
  });

  app.patch("/api/passwords/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { password, ...rest } = req.body;
      let updateData = { ...rest };
      
      if (password) {
        const { encryptPassword } = await import("./crypto");
        updateData.encryptedPassword = encryptPassword(password);
      }
      
      const validatedData = insertPasswordSchema.partial().parse(updateData);
      const updated = await storage.updatePassword(id, userId, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Password not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update password" });
    }
  });

  app.delete("/api/passwords/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.deletePassword(id, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete password" });
    }
  });

  return httpServer;
}

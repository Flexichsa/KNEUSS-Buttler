import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTodoSchema, insertNoteSchema } from "@shared/schema";
import { getEmails, getTodayEvents, isOutlookConnected } from "./outlook";
import { chatCompletion, summarizeEmails } from "./openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Outlook Integration Status
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

  // Todos CRUD
  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos();
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
      const { completed } = req.body;
      const todo = await storage.updateTodo(id, completed);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update todo" });
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

  return httpServer;
}

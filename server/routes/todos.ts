import { Router } from "express";
import { storage } from "../storage";
import { insertTodoSchema, updateTodoSchema, insertTodoLabelSchema, insertTodoSectionSchema, todoAttachments } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "../replit_integrations/object_storage";
import multer from "multer";
import fs from "fs";

const router = Router();
const objectStorageService = new ObjectStorageService();

const attachmentUpload = multer({
  dest: "/tmp/uploads",
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
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

// Todo Labels CRUD
router.get("/todo-labels", async (_req, res) => {
  try {
    const labels = await storage.getTodoLabels();
    res.json(labels);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch labels" });
  }
});

router.post("/todo-labels", async (req, res) => {
  try {
    const validatedData = insertTodoLabelSchema.parse(req.body);
    const label = await storage.createTodoLabel(validatedData);
    res.status(201).json(label);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid label data" });
  }
});

router.patch("/todo-labels/:id", async (req, res) => {
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

router.delete("/todo-labels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTodoLabel(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete label" });
  }
});

// Todo Sections CRUD
router.get("/todo-sections", async (req, res) => {
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

router.post("/todo-sections", async (req, res) => {
  try {
    const validatedData = insertTodoSectionSchema.parse(req.body);
    const section = await storage.createTodoSection(validatedData);
    res.status(201).json(section);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid section data" });
  }
});

router.patch("/todo-sections/:id", async (req, res) => {
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

router.delete("/todo-sections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTodoSection(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete section" });
  }
});

// Todos CRUD
router.get("/todos", async (_req, res) => {
  try {
    const todos = await storage.getTodos();
    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch todos" });
  }
});

router.get("/todos/today", async (_req, res) => {
  try {
    const todos = await storage.getTodosForToday();
    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch today's todos" });
  }
});

router.get("/todos/upcoming", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const todos = await storage.getUpcomingTodos(days);
    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch upcoming todos" });
  }
});

router.get("/todos/with-subtasks", async (_req, res) => {
  try {
    const todos = await storage.getTodosWithSubtasks();
    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch todos" });
  }
});

router.post("/todos", async (req, res) => {
  try {
    const validatedData = insertTodoSchema.parse(req.body);
    const todo = await storage.createTodo(validatedData);
    res.status(201).json(todo);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid todo data" });
  }
});

router.patch("/todos/:id", async (req, res) => {
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

router.post("/todos/reorder", async (req, res) => {
  try {
    const orderings = req.body as { id: number; orderIndex: number }[];
    await storage.reorderTodos(orderings);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to reorder todos" });
  }
});

router.delete("/todos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteTodo(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete todo" });
  }
});

// Todo Attachments
router.get("/todos/:todoId/attachments", async (req, res) => {
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

router.post("/todos/:todoId/attachments", attachmentUpload.single('file'), async (req, res) => {
  try {
    const todoId = parseInt(req.params.todoId);
    if (isNaN(todoId)) {
      return res.status(400).json({ error: "Invalid todo ID" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: fileBuffer,
      headers: { "Content-Type": file.mimetype },
    });

    if (!uploadResponse.ok) {
      fs.unlinkSync(file.path);
      throw new Error("Failed to upload to Object Storage");
    }

    fs.unlinkSync(file.path);
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

    const attachment = await storage.createTodoAttachment({
      todoId,
      filename: file.filename,
      originalName: sanitizedOriginalName,
      mimeType: file.mimetype,
      size: file.size,
      path: objectPath,
    });

    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to upload attachment" });
  }
});

router.get("/attachments/:id/download", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [attachment] = await db.select().from(todoAttachments).where(eq(todoAttachments.id, id));

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    try {
      const objectFile = await objectStorageService.getObjectEntityFile(attachment.path);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (objError) {
      if (objError instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      throw objError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to download attachment" });
  }
});

router.get("/attachments/:id/preview", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [attachment] = await db.select().from(todoAttachments).where(eq(todoAttachments.id, id));

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    try {
      const objectFile = await objectStorageService.getObjectEntityFile(attachment.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (objError) {
      if (objError instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      throw objError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to preview attachment" });
  }
});

router.delete("/attachments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteTodoAttachment(id);

    if (!deleted) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    if (deleted.path && deleted.path.startsWith("/objects/")) {
      try {
        await objectStorageService.deleteObjectEntity(deleted.path);
      } catch (deleteError) {
        console.warn("[Attachment] Failed to delete from Object Storage:", deleteError);
      }
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete attachment" });
  }
});

export default router;

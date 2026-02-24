import { Router } from "express";
import { storage } from "../storage";
import { insertPasswordSchema, insertPasswordCategorySchema, updatePasswordCategorySchema } from "@shared/schema";
import { getUserId, isAuthenticatedCustom } from "../customAuth";

const router = Router();

// All password routes require authentication
router.use(isAuthenticatedCustom);

// Passwords CRUD
router.get("/passwords", async (req, res) => {
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

router.get("/passwords/:id", async (req, res) => {
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

router.get("/passwords/:id/decrypt", async (req, res) => {
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
    const { decryptPassword } = await import("../crypto");
    const decrypted = decryptPassword(password.encryptedPassword);
    res.json({ password: decrypted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to decrypt password" });
  }
});

router.post("/passwords", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password, username, url, notes, ...rest } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    const { encryptPassword } = await import("../crypto");
    const encryptedPassword = encryptPassword(password);
    const validatedData = insertPasswordSchema.parse({
      ...rest,
      userId,
      encryptedPassword,
      username: username?.trim() || null,
      url: url?.trim() || null,
      notes: notes?.trim() || null
    });
    const created = await storage.createPassword(validatedData);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create password" });
  }
});

router.patch("/passwords/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password, username, url, notes, ...rest } = req.body;
    let updateData: any = { ...rest };

    if (password) {
      const { encryptPassword } = await import("../crypto");
      updateData.encryptedPassword = encryptPassword(password);
    }

    if (username !== undefined) {
      updateData.username = username?.trim() || null;
    }
    if (url !== undefined) {
      updateData.url = url?.trim() || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
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

router.delete("/passwords/:id", async (req, res) => {
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

// Password Categories CRUD
router.get("/password-categories", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Initialize default categories if none exist
    await storage.initializeDefaultPasswordCategories(userId);
    const categories = await storage.getPasswordCategories(userId);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch password categories" });
  }
});

router.post("/password-categories", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const validatedData = insertPasswordCategorySchema.parse({ ...req.body, userId });
    const created = await storage.createPasswordCategory(validatedData);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create password category" });
  }
});

router.patch("/password-categories/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the old category to check for name change
    const oldCategory = await storage.getPasswordCategory(id, userId);
    if (!oldCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    const validatedData = updatePasswordCategorySchema.parse(req.body);
    const updated = await storage.updatePasswordCategory(id, userId, validatedData);
    if (!updated) {
      return res.status(404).json({ error: "Category not found" });
    }

    // If category name changed, update all passwords using this category
    if (validatedData.name && validatedData.name !== oldCategory.name) {
      await storage.updatePasswordsCategory(userId, oldCategory.name, validatedData.name);
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update password category" });
  }
});

router.delete("/password-categories/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Don't allow deleting the default category
    const category = await storage.getPasswordCategory(id, userId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    if (category.isDefault) {
      return res.status(400).json({ error: "Cannot delete the default category" });
    }

    // Get default category to move passwords to
    const allCategories = await storage.getPasswordCategories(userId);
    const defaultCategory = allCategories.find(c => c.isDefault);
    const defaultCategoryName = defaultCategory?.name || "Allgemein";

    // Move all passwords in this category to the default category
    await storage.updatePasswordsCategory(userId, category.name, defaultCategoryName);

    // Now delete the category
    await storage.deletePasswordCategory(id, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete password category" });
  }
});

export default router;

import { Router } from "express";
import { storage } from "../storage";
import { insertContactSchema, insertContactPersonSchema, insertContactDetailSchema } from "@shared/schema";

const router = Router();

// Contacts CRUD
router.get("/contacts", async (_req, res) => {
  try {
    const contacts = await storage.getContacts();
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
});

router.get("/contacts/:id", async (req, res) => {
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

router.post("/contacts", async (req, res) => {
  try {
    const validatedData = insertContactSchema.parse(req.body);
    const contact = await storage.createContact(validatedData);
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create contact" });
  }
});

router.patch("/contacts/:id", async (req, res) => {
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

router.delete("/contacts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteContact(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete contact" });
  }
});

// Contact Persons CRUD
router.get("/contacts/:contactId/persons", async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const persons = await storage.getContactPersons(contactId);
    res.json(persons);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch contact persons" });
  }
});

router.post("/contacts/:contactId/persons", async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const validatedData = insertContactPersonSchema.omit({ contactId: true }).parse(req.body);
    const person = await storage.createContactPerson({ ...validatedData, contactId });
    res.status(201).json(person);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create contact person" });
  }
});

router.patch("/contact-persons/:id", async (req, res) => {
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

router.delete("/contact-persons/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteContactPerson(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete contact person" });
  }
});

// Contact Details CRUD
router.get("/contacts/:contactId/details", async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const details = await storage.getContactDetails(contactId);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch contact details" });
  }
});

router.get("/contact-persons/:personId/details", async (req, res) => {
  try {
    const personId = parseInt(req.params.personId);
    const details = await storage.getPersonDetails(personId);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch person details" });
  }
});

router.post("/contact-details", async (req, res) => {
  try {
    const data = insertContactDetailSchema.parse(req.body);
    const detail = await storage.createContactDetail(data);
    res.status(201).json(detail);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create contact detail" });
  }
});

router.patch("/contact-details/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertContactDetailSchema.partial().parse(req.body);
    const detail = await storage.updateContactDetail(id, data);
    if (!detail) {
      return res.status(404).json({ error: "Contact detail not found" });
    }
    res.json(detail);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update contact detail" });
  }
});

router.delete("/contact-details/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteContactDetail(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete contact detail" });
  }
});

export default router;

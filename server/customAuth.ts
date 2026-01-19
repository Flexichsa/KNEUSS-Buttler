import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler, Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await hashPassword(data.password);
  const [user] = await db.insert(users).values({
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
  }).returning();
  return user;
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }) {
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

export function getUserId(req: Request): string | undefined {
  const user = req.user as any;
  if (!user) return undefined;
  
  if (user.claims?.sub) {
    return user.claims.sub;
  }
  
  if (user.id) {
    return user.id;
  }
  
  return undefined;
}

export const isAuthenticatedCustom: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (user.claims?.sub) {
    const now = Math.floor(Date.now() / 1000);
    if (user.expires_at && now > user.expires_at) {
      return res.status(401).json({ message: "Session expired" });
    }
    return next();
  }
  
  if (user.id) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

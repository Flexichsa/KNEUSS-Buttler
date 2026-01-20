import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../db";
import { users, passwordResetTokens } from "@shared/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import type { RequestHandler, Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
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

export async function createPasswordResetToken(email: string): Promise<{ token: string; userId: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);
  
  if (!user) {
    return null;
  }
  
  // Invalidate any existing tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
  
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });
  
  return { token, userId: user.id };
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );
  
  if (!resetToken) {
    return null;
  }
  
  return resetToken.userId;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const userId = await verifyPasswordResetToken(token);
  
  if (!userId) {
    return false;
  }
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.tokenHash, tokenHash));
  
  await updateUserPassword(userId, newPassword);
  
  return true;
}

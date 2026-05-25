import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { db } from "../db";
import { tokenBlacklistTable } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided", timestamp: new Date().toISOString() });
    return;
  }

  const token = authHeader.slice(7);

  const blacklisted = await db
    .select()
    .from(tokenBlacklistTable)
    .where(eq(tokenBlacklistTable.token, token))
    .limit(1);

  if (blacklisted.length > 0) {
    res.status(401).json({ success: false, message: "Token has been invalidated", timestamp: new Date().toISOString() });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token", timestamp: new Date().toISOString() });
  }
}

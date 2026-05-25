import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { usersTable, accountsTable, tokenBlacklistTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { signToken, signRefreshToken } from "../lib/jwt";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { writeAuditLog } from "../lib/audit";

const router = Router();

function generateAccountNumber(): string {
  const prefix = "BTMS";
  const random = Math.floor(Math.random() * 1000000000000).toString().padStart(12, "0");
  return `${prefix}${random}`;
}

function formatUser(user: { id: string; fullName: string; email: string; phone: string; role: string; isActive: boolean; createdAt: Date }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/register", async (req: Request, res: Response) => {
  const { fullName, email, phone, password } = req.body;
  if (!fullName || !email || !phone || !password) {
    res.status(400).json({ success: false, message: "fullName, email, phone, and password are required", timestamp: new Date().toISOString() });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: "Password must be at least 8 characters", timestamp: new Date().toISOString() });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ success: false, message: "User with this email already exists", errorCode: "USER_ALREADY_EXISTS", timestamp: new Date().toISOString() });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const [user] = await db.insert(usersTable).values({ id: userId, fullName, email: email.toLowerCase(), passwordHash, phone, role: "ROLE_USER", isActive: true }).returning();
  await db.insert(accountsTable).values({ id: uuidv4(), userId, accountNumber: generateAccountNumber(), accountType: "SAVINGS", balance: "10000.00", currency: "INR", status: "ACTIVE" });
  const token = signToken({ userId, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ userId, email: user.email, role: user.role });
  await writeAuditLog(userId, "REGISTER", req.ip);
  res.status(201).json({ token, refreshToken, user: formatUser(user) });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required", timestamp: new Date().toISOString() });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid credentials", timestamp: new Date().toISOString() });
    return;
  }
  if (!user.isActive) {
    res.status(401).json({ success: false, message: "Account is inactive", timestamp: new Date().toISOString() });
    return;
  }
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    res.status(401).json({ success: false, message: "Invalid credentials", timestamp: new Date().toISOString() });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });
  await writeAuditLog(user.id, "LOGIN", req.ip);
  res.json({ token, refreshToken, user: formatUser(user) });
});

router.post("/logout", requireAuth, async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization!.slice(7);
  await db.insert(tokenBlacklistTable).values({ id: uuidv4(), token }).onConflictDoNothing();
  await writeAuditLog(req.user!.userId, "LOGOUT", req.ip);
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;

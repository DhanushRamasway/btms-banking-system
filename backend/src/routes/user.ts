import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { writeAuditLog } from "../lib/audit";

const router = Router();

const fmt = (u: any) => ({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, createdAt: u.createdAt.toISOString() });

router.get("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) { res.status(404).json({ success: false, message: "User not found", timestamp: new Date().toISOString() }); return; }
  res.json(fmt(user));
});

router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const { fullName, phone } = req.body;
  const updateData: Record<string, unknown> = {};
  if (fullName && fullName.trim().length >= 2) updateData.fullName = fullName.trim();
  if (phone && phone.length >= 10) updateData.phone = phone;
  if (Object.keys(updateData).length === 0) { res.status(400).json({ success: false, message: "No valid fields to update", timestamp: new Date().toISOString() }); return; }
  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.user!.userId)).returning();
  res.json(fmt(updated));
});

router.put("/change-password", requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) { res.status(400).json({ success: false, message: "currentPassword, newPassword, and confirmPassword are required", timestamp: new Date().toISOString() }); return; }
  if (newPassword !== confirmPassword) { res.status(400).json({ success: false, message: "New password and confirm password do not match", timestamp: new Date().toISOString() }); return; }
  if (newPassword.length < 8) { res.status(400).json({ success: false, message: "New password must be at least 8 characters", timestamp: new Date().toISOString() }); return; }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) { res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter, one number, and one special character", timestamp: new Date().toISOString() }); return; }
  if (newPassword === currentPassword) { res.status(400).json({ success: false, message: "New password must be different from current password", timestamp: new Date().toISOString() }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!await bcrypt.compare(currentPassword, user.passwordHash)) { res.status(400).json({ success: false, message: "Current password is incorrect", timestamp: new Date().toISOString() }); return; }
  await db.update(usersTable).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(usersTable.id, req.user!.userId));
  await writeAuditLog(req.user!.userId, "PASSWORD_CHANGE", req.ip);
  res.json({ success: true, message: "Password changed successfully" });
});

export default router;

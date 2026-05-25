import { Router, Response } from "express";
import { db } from "../db";
import { beneficiariesTable, accountsTable } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const fmt = (b: any) => ({ id: b.id, userId: b.userId, beneficiaryName: b.beneficiaryName, accountNumber: b.accountNumber, bankName: b.bankName, ifscCode: b.ifscCode, isActive: b.isActive, createdAt: b.createdAt.toISOString() });

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const beneficiaries = await db.select().from(beneficiariesTable).where(and(eq(beneficiariesTable.userId, req.user!.userId), eq(beneficiariesTable.isActive, true))).orderBy(beneficiariesTable.createdAt);
  res.json(beneficiaries.map(fmt));
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { beneficiaryName, accountNumber, bankName, ifscCode } = req.body;
  if (!beneficiaryName || !accountNumber || !bankName || !ifscCode) { res.status(400).json({ success: false, message: "beneficiaryName, accountNumber, bankName, and ifscCode are required", timestamp: new Date().toISOString() }); return; }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.accountNumber, String(accountNumber))).limit(1);
  if (!account) { res.status(400).json({ success: false, message: "Account number does not exist in the system", timestamp: new Date().toISOString() }); return; }
  const [b] = await db.insert(beneficiariesTable).values({ id: uuidv4(), userId: req.user!.userId, beneficiaryName: String(beneficiaryName), accountNumber: String(accountNumber), bankName: String(bankName), ifscCode: String(ifscCode), isActive: true }).returning();
  res.status(201).json(fmt(b));
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const [b] = await db.select().from(beneficiariesTable).where(and(eq(beneficiariesTable.id, String(req.params.id)), eq(beneficiariesTable.userId, req.user!.userId), eq(beneficiariesTable.isActive, true))).limit(1);
  if (!b) { res.status(404).json({ success: false, message: "Beneficiary not found", timestamp: new Date().toISOString() }); return; }
  res.json(fmt(b));
});

router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const [existing] = await db.select().from(beneficiariesTable).where(and(eq(beneficiariesTable.id, id), eq(beneficiariesTable.userId, req.user!.userId), eq(beneficiariesTable.isActive, true))).limit(1);
  if (!existing) { res.status(404).json({ success: false, message: "Beneficiary not found", timestamp: new Date().toISOString() }); return; }
  const { beneficiaryName, bankName, ifscCode } = req.body;
  const updateFields: any = {};
  if (beneficiaryName) updateFields.beneficiaryName = String(beneficiaryName);
  if (bankName) updateFields.bankName = String(bankName);
  if (ifscCode) updateFields.ifscCode = String(ifscCode);
  const [updated] = await db.update(beneficiariesTable).set(updateFields).where(eq(beneficiariesTable.id, id)).returning();
  res.json(fmt(updated));
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const [existing] = await db.select().from(beneficiariesTable).where(and(eq(beneficiariesTable.id, id), eq(beneficiariesTable.userId, req.user!.userId))).limit(1);
  if (!existing) { res.status(404).json({ success: false, message: "Beneficiary not found", timestamp: new Date().toISOString() }); return; }
  await db.update(beneficiariesTable).set({ isActive: false }).where(eq(beneficiariesTable.id, id));
  res.json({ success: true, message: "Beneficiary deleted successfully" });
});

export default router;

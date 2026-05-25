import { Router, Response } from "express";
import { db } from "../db";
import { accountsTable, usersTable, transactionsTable } from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.status(404).json({ success: false, message: "Account not found", timestamp: new Date().toISOString() }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({
    id: account.id, accountNumber: account.accountNumber, accountType: account.accountType,
    balance: parseFloat(account.balance), currency: account.currency, status: account.status,
    createdAt: account.createdAt.toISOString(),
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString() },
  });
});

router.get("/summary", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.json({ totalCredits: 0, totalDebits: 0, netBalance: 0, month: now.getMonth() + 1, year: now.getFullYear(), transactionCount: 0 }); return; }
  const creditRows = await db.select({ total: sql<string>`coalesce(sum(amount), 0)`, count: sql<string>`count(*)` }).from(transactionsTable)
    .where(and(eq(transactionsTable.toAccountId, account.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfMonth), lte(transactionsTable.createdAt, endOfMonth)));
  const debitRows = await db.select({ total: sql<string>`coalesce(sum(amount), 0)`, count: sql<string>`count(*)` }).from(transactionsTable)
    .where(and(eq(transactionsTable.fromAccountId, account.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfMonth), lte(transactionsTable.createdAt, endOfMonth)));
  const totalCredits = parseFloat(creditRows[0]?.total || "0");
  const totalDebits = parseFloat(debitRows[0]?.total || "0");
  res.json({ totalCredits, totalDebits, netBalance: totalCredits - totalDebits, month: now.getMonth() + 1, year: now.getFullYear(), transactionCount: parseInt(creditRows[0]?.count || "0") + parseInt(debitRows[0]?.count || "0") });
});

router.get("/mini-statement", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.json([]); return; }
  const txns = await db.select().from(transactionsTable)
    .where(sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`)
    .orderBy(sql`${transactionsTable.createdAt} DESC`).limit(5);
  res.json(txns.map((t) => ({ id: t.id, fromAccountId: t.fromAccountId, toAccountId: t.toAccountId, fromAccountNumber: null, toAccountNumber: null, amount: parseFloat(t.amount), type: t.fromAccountId === account.id ? "DEBIT" : "CREDIT", status: t.status, description: t.description, referenceNo: t.referenceNo, createdAt: t.createdAt.toISOString() })));
});

export default router;

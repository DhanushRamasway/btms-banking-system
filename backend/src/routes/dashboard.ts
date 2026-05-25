import { Router, Response } from "express";
import { db } from "../db";
import { accountsTable, transactionsTable, beneficiariesTable, auditLogsTable } from "../db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();
const DAILY_LIMIT = 100000;

router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.json({ accountBalance: 0, monthlyCredits: 0, monthlyDebits: 0, totalTransactions: 0, pendingTransactions: 0, activeBeneficiaries: 0, dailySpent: 0, dailyLimit: DAILY_LIMIT }); return; }
  const [creditRow] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.toAccountId, account.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfMonth)));
  const [debitRow] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.fromAccountId, account.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfMonth)));
  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(transactionsTable).where(sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`);
  const [pendingRow] = await db.select({ count: sql<string>`count(*)` }).from(transactionsTable).where(and(sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`, eq(transactionsTable.status, "PENDING")));
  const [benefRow] = await db.select({ count: sql<string>`count(*)` }).from(beneficiariesTable).where(and(eq(beneficiariesTable.userId, userId), eq(beneficiariesTable.isActive, true)));
  const [dailyRow] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.fromAccountId, account.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfDay)));
  res.json({ accountBalance: parseFloat(account.balance), monthlyCredits: parseFloat(creditRow?.total || "0"), monthlyDebits: parseFloat(debitRow?.total || "0"), totalTransactions: parseInt(countRow?.count || "0"), pendingTransactions: parseInt(pendingRow?.count || "0"), activeBeneficiaries: parseInt(benefRow?.count || "0"), dailySpent: parseFloat(dailyRow?.total || "0"), dailyLimit: DAILY_LIMIT });
});

router.get("/activity", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  const recentTxns = account ? await db.select().from(transactionsTable).where(sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`).orderBy(desc(transactionsTable.createdAt)).limit(6) : [];
  const recentLogs = await db.select().from(auditLogsTable).where(eq(auditLogsTable.userId, userId)).orderBy(desc(auditLogsTable.timestamp)).limit(4);
  const txnActivities = recentTxns.map((t) => ({ id: t.id, type: account && t.fromAccountId === account.id ? "DEBIT" : "CREDIT", description: t.description, amount: parseFloat(t.amount), createdAt: t.createdAt.toISOString(), status: t.status }));
  const logActivities = recentLogs.filter((l) => l.action === "LOGIN" || l.action === "PASSWORD_CHANGE").map((l) => ({ id: l.id, type: l.action, description: l.action === "LOGIN" ? "Account login" : "Password changed", amount: null, createdAt: l.timestamp.toISOString(), status: "SUCCESS" }));
  res.json([...txnActivities, ...logActivities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10));
});

export default router;

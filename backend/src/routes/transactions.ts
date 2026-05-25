import { Router, Response } from "express";
import { db } from "../db";
import { accountsTable, transactionsTable } from "../db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(String(req.query.page ?? "0")) || 0;
  const size = parseInt(String(req.query.size ?? "10")) || 10;
  const type = String(req.query.type ?? "ALL");
  const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
  const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.json({ content: [], totalElements: 0, totalPages: 0, page, size }); return; }
  const baseCondition = sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`;
  const buildConditions = (extra?: any) => {
    const conds = [baseCondition, ...(extra ? [extra] : [])];
    if (startDate) conds.push(gte(transactionsTable.createdAt, new Date(startDate)));
    if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); conds.push(lte(transactionsTable.createdAt, end)); }
    return conds.length === 1 ? conds[0] : and(...conds);
  };
  const whereClause = type === "CREDIT" ? buildConditions(eq(transactionsTable.toAccountId, account.id)) : type === "DEBIT" ? buildConditions(eq(transactionsTable.fromAccountId, account.id)) : buildConditions();
  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(transactionsTable).where(whereClause);
  const totalElements = parseInt(countRow?.count || "0");
  const totalPages = Math.ceil(totalElements / size);
  const txns = await db.select().from(transactionsTable).where(whereClause).orderBy(desc(transactionsTable.createdAt)).limit(size).offset(page * size);
  res.json({ content: txns.map((t) => ({ id: t.id, fromAccountId: t.fromAccountId, toAccountId: t.toAccountId, fromAccountNumber: null, toAccountNumber: null, amount: parseFloat(t.amount), type: t.fromAccountId === account.id ? "DEBIT" : "CREDIT", status: t.status, description: t.description, referenceNo: t.referenceNo, createdAt: t.createdAt.toISOString() })), totalElements, totalPages, page, size });
});

router.get("/export", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.status(404).json({ success: false, message: "Account not found", timestamp: new Date().toISOString() }); return; }
  const txns = await db.select().from(transactionsTable).where(sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`).orderBy(desc(transactionsTable.createdAt));
  const header = "Reference No,Type,Amount,Status,Description,Date\n";
  const rows = txns.map((t) => `${t.referenceNo},${t.fromAccountId === account.id ? "DEBIT" : "CREDIT"},${t.amount},${t.status},"${t.description}",${t.createdAt.toISOString()}`).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="transactions_${Date.now()}.csv"`);
  res.send(header + rows);
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!account) { res.status(404).json({ success: false, message: "Account not found", timestamp: new Date().toISOString() }); return; }
  const [txn] = await db.select().from(transactionsTable).where(and(eq(transactionsTable.id, id), sql`(${transactionsTable.fromAccountId} = ${account.id} OR ${transactionsTable.toAccountId} = ${account.id})`)).limit(1);
  if (!txn) { res.status(404).json({ success: false, message: "Transaction not found", timestamp: new Date().toISOString() }); return; }
  let fromAccountNumber: string | null = null;
  let toAccountNumber: string | null = null;
  if (txn.fromAccountId) { const [fa] = await db.select({ accountNumber: accountsTable.accountNumber }).from(accountsTable).where(eq(accountsTable.id, txn.fromAccountId)).limit(1); fromAccountNumber = fa?.accountNumber ?? null; }
  if (txn.toAccountId) { const [ta] = await db.select({ accountNumber: accountsTable.accountNumber }).from(accountsTable).where(eq(accountsTable.id, txn.toAccountId)).limit(1); toAccountNumber = ta?.accountNumber ?? null; }
  res.json({ id: txn.id, fromAccountId: txn.fromAccountId, toAccountId: txn.toAccountId, fromAccountNumber, toAccountNumber, amount: parseFloat(txn.amount), type: txn.fromAccountId === account.id ? "DEBIT" : "CREDIT", status: txn.status, description: txn.description, referenceNo: txn.referenceNo, createdAt: txn.createdAt.toISOString() });
});

export default router;

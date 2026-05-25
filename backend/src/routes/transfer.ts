import { Router, Response } from "express";
import { db } from "../db";
import { accountsTable, transactionsTable } from "../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { writeAuditLog } from "../lib/audit";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const DAILY_LIMIT = 100000;

function generateReferenceNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `TXN${timestamp}${random}`;
}

router.post("/initiate", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { toAccountNumber, amount, description } = req.body;
  if (!toAccountNumber || !amount) { res.status(400).json({ success: false, message: "toAccountNumber and amount are required", timestamp: new Date().toISOString() }); return; }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) { res.status(400).json({ success: false, message: "Amount must be a positive number", timestamp: new Date().toISOString() }); return; }
  const [fromAccount] = await db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).limit(1);
  if (!fromAccount) { res.status(404).json({ success: false, message: "Sender account not found", timestamp: new Date().toISOString() }); return; }
  if (fromAccount.accountNumber === toAccountNumber) { res.status(400).json({ success: false, message: "Cannot transfer to your own account", errorCode: "SELF_TRANSFER", timestamp: new Date().toISOString() }); return; }
  const [toAccount] = await db.select().from(accountsTable).where(eq(accountsTable.accountNumber, toAccountNumber)).limit(1);
  if (!toAccount) { res.status(404).json({ success: false, message: "Recipient account not found", errorCode: "ACCOUNT_NOT_FOUND", timestamp: new Date().toISOString() }); return; }
  if (toAccount.status !== "ACTIVE") { res.status(400).json({ success: false, message: "Recipient account is not active", timestamp: new Date().toISOString() }); return; }
  if (parseFloat(fromAccount.balance) < numAmount) { res.status(400).json({ success: false, message: "Insufficient funds", errorCode: "INSUFFICIENT_FUNDS", timestamp: new Date().toISOString() }); return; }
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const dailyRows = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable)
    .where(and(eq(transactionsTable.fromAccountId, fromAccount.id), eq(transactionsTable.status, "SUCCESS"), gte(transactionsTable.createdAt, startOfDay)));
  if (parseFloat(dailyRows[0]?.total || "0") + numAmount > DAILY_LIMIT) { res.status(400).json({ success: false, message: `Daily transfer limit of ₹${DAILY_LIMIT.toLocaleString()} exceeded`, errorCode: "DAILY_LIMIT_EXCEEDED", timestamp: new Date().toISOString() }); return; }
  const referenceNo = generateReferenceNo();
  const txnId = uuidv4();
  await db.transaction(async (tx) => {
    await tx.update(accountsTable).set({ balance: sql`balance - ${numAmount}` }).where(eq(accountsTable.id, fromAccount.id));
    await tx.update(accountsTable).set({ balance: sql`balance + ${numAmount}` }).where(eq(accountsTable.id, toAccount.id));
    await tx.insert(transactionsTable).values({ id: txnId, fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: numAmount.toString(), type: "TRANSFER", status: "SUCCESS", description: description || "Fund Transfer", referenceNo });
  });
  await writeAuditLog(userId, "TRANSFER", req.ip, `Transfer of ₹${numAmount} to ${toAccountNumber}, ref: ${referenceNo}`);
  const [txn] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txnId)).limit(1);
  res.json({ success: true, referenceNo, message: "Transfer successful", transaction: { id: txn.id, fromAccountId: txn.fromAccountId, toAccountId: txn.toAccountId, fromAccountNumber: fromAccount.accountNumber, toAccountNumber: toAccount.accountNumber, amount: parseFloat(txn.amount), type: txn.type, status: txn.status, description: txn.description, referenceNo: txn.referenceNo, createdAt: txn.createdAt.toISOString() } });
});

router.get("/status/:referenceNo", requireAuth, async (req: AuthRequest, res: Response) => {
  const referenceNo = String(req.params.referenceNo);
  const [txn] = await db.select().from(transactionsTable).where(eq(transactionsTable.referenceNo, referenceNo)).limit(1);
  if (!txn) { res.status(404).json({ success: false, message: "Transaction not found", timestamp: new Date().toISOString() }); return; }
  let fromAccountNumber: string | null = null;
  let toAccountNumber: string | null = null;
  if (txn.fromAccountId) { const [fa] = await db.select({ accountNumber: accountsTable.accountNumber }).from(accountsTable).where(eq(accountsTable.id, txn.fromAccountId)).limit(1); fromAccountNumber = fa?.accountNumber ?? null; }
  if (txn.toAccountId) { const [ta] = await db.select({ accountNumber: accountsTable.accountNumber }).from(accountsTable).where(eq(accountsTable.id, txn.toAccountId)).limit(1); toAccountNumber = ta?.accountNumber ?? null; }
  res.json({ id: txn.id, fromAccountId: txn.fromAccountId, toAccountId: txn.toAccountId, fromAccountNumber, toAccountNumber, amount: parseFloat(txn.amount), type: txn.type, status: txn.status, description: txn.description, referenceNo: txn.referenceNo, createdAt: txn.createdAt.toISOString() });
});

export default router;

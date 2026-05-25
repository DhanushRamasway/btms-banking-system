import { pgTable, text, boolean, timestamp, decimal } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("ROLE_USER"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  accountNumber: text("account_number").notNull().unique(),
  accountType: text("account_type").notNull().default("SAVINGS"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  fromAccountId: text("from_account_id"),
  toAccountId: text("to_account_id"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("SUCCESS"),
  description: text("description").notNull().default(""),
  referenceNo: text("reference_no").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const beneficiariesTable = pgTable("beneficiaries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  beneficiaryName: text("beneficiary_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const tokenBlacklistTable = pgTable("token_blacklist", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Account = typeof accountsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type Beneficiary = typeof beneficiariesTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type TokenBlacklist = typeof tokenBlacklistTable.$inferSelect;

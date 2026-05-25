import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { auditLogsTable } from "../db/schema";

export async function writeAuditLog(
  userId: string,
  action: string,
  ipAddress: string | undefined,
  details?: string
) {
  await db.insert(auditLogsTable).values({
    id: uuidv4(),
    userId,
    action,
    ipAddress: ipAddress || "unknown",
    details: details || null,
  });
}

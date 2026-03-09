import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Scan history: every scan event is logged here for audit trail.
 * Stores the raw scanned code, the resolved HubSpot record type/id,
 * the action taken (view | receive | checkin), and outcome.
 */
export const scanHistory = mysqlTable("scan_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Raw value decoded from the QR/barcode */
  scannedCode: varchar("scannedCode", { length: 512 }).notNull(),
  /** HubSpot object type resolved: parts_line | parts_order | sales_order_line | unknown */
  resolvedType: varchar("resolvedType", { length: 64 }),
  /** HubSpot record ID */
  hubspotId: varchar("hubspotId", { length: 64 }),
  /** Display name / PO number for quick reference */
  displayName: varchar("displayName", { length: 256 }),
  /** Action performed */
  action: mysqlEnum("action", ["view", "receive", "checkin"]).default("view").notNull(),
  /** Whether the action succeeded */
  success: int("success").default(1).notNull(),
  /** Optional note (e.g. bin location set) */
  note: text("note"),
  /** User who performed the scan */
  userId: int("userId"),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});

export type ScanHistory = typeof scanHistory.$inferSelect;
export type InsertScanHistory = typeof scanHistory.$inferInsert;
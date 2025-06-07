import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userAddress: text("user_address").notNull(),
  type: text("type").notNull(), // 'eth_to_mt', 'mt_to_eth', 'create_fd', 'withdraw_fd', 'transfer', 'claim_interest'
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"), // 'pending', 'success', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fixedDeposits = pgTable("fixed_deposits", {
  id: serial("id").primaryKey(),
  userAddress: text("user_address").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  months: integer("months").notNull(),
  startDate: timestamp("start_date").notNull(),
  maturityDate: timestamp("maturity_date").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'withdrawn', 'renewed'
  txHash: text("tx_hash"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertFixedDepositSchema = createInsertSchema(fixedDeposits).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertFixedDeposit = z.infer<typeof insertFixedDepositSchema>;
export type FixedDeposit = typeof fixedDeposits.$inferSelect;

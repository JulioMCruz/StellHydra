import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  fromNetwork: text("from_network").notNull(),
  toNetwork: text("to_network").notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  fromAmount: decimal("from_amount", { precision: 36, scale: 18 }).notNull(),
  toAmount: decimal("to_amount", { precision: 36, scale: 18 }),
  status: text("status").notNull().default("pending"), // pending, confirming, completed, failed
  txHashFrom: text("tx_hash_from"),
  txHashTo: text("tx_hash_to"),
  dexSource: text("dex_source"),
  fee: decimal("fee", { precision: 36, scale: 18 }),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dexPrices = pgTable("dex_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dexName: text("dex_name").notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  rate: decimal("rate", { precision: 36, scale: 18 }).notNull(),
  liquidity: decimal("liquidity", { precision: 36, scale: 18 }),
  fee: decimal("fee", { precision: 10, scale: 6 }),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  network: text("network").notNull(),
  balances: jsonb("balances").default({}),
  isConnected: boolean("is_connected").default(false),
  lastSynced: timestamp("last_synced").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDexPriceSchema = createInsertSchema(dexPrices).omit({
  id: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  lastSynced: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertDexPrice = z.infer<typeof insertDexPriceSchema>;
export type DexPrice = typeof dexPrices.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

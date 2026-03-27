import {
  serial,
  varchar,
  timestamp,
  integer,
  decimal,
  date,
  text,
  pgTable,
} from "drizzle-orm/pg-core";

// 用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 分类表
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'income' | 'expense'
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 记账记录表
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 10 }).notNull(), // 'income' | 'expense'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 预算表
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 格式: 2026-03
  createdAt: timestamp("created_at").defaultNow(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Record = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

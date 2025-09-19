import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
});

export const chatsTable = sqliteTable("chats_table", {
  id: text().primaryKey(),
  userId: int().notNull().references(() => usersTable.id),
  title: text().notNull(),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messagesTable = sqliteTable("messages_table", {
  id: int().primaryKey({ autoIncrement: true }),
  chatId: text().notNull().references(() => chatsTable.id),
  role: text().notNull(), // 'user' or 'assistant'
  content: text().notNull(),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`).notNull(),
});

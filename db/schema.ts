import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';
export const documents = pgTable('log_documents', {
  path: text().primaryKey(),
  data: jsonb().notNull(),
});

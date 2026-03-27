import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

// 使用 Vercel Postgres 连接
export const db = drizzle(sql, { schema });

// 导出 schema 供其他地方使用
export { schema };

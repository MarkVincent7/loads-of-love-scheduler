import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database access will fail until it is configured.");
}

export const pool = connectionString ? new Pool({ connectionString }) : null;

export const db = pool
  ? drizzle(pool, { schema })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "DATABASE_URL must be set. Did you forget to provision a database?",
          );
        },
      },
    ) as ReturnType<typeof drizzle<typeof schema>>);

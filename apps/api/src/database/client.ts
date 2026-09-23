import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

import { env } from "../env";
import { table } from "./schema";

export const db = drizzle({ connection: env.DATABASE_URL, schema: table });

// Relative to the working directory: apps/api in dev, /app in the production image.
export const runMigrations = () => migrate(db, { migrationsFolder: "./drizzle" });

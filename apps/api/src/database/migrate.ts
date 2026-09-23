// Same migrator as the server startup, so dev and prod apply migrations the same way
// (drizzle-kit migrate would need a Node Postgres driver on top of Bun.SQL).
import { db, runMigrations } from "./client";

await runMigrations();

await db.$client.close();

console.log("Migrations applied");

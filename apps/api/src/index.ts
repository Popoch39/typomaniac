import { Elysia } from "elysia";

import { runMigrations } from "./database/client";
import { env } from "./env";

await runMigrations();

const app = new Elysia().get("/", () => "Hello Elysia").listen(env.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

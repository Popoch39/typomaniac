import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";

const EnvSchema = t.Object({
  DATABASE_URL: t.String({ minLength: 1 }),
  PORT: t.Number({ default: 3000 }),
});

export type Env = typeof EnvSchema.static;

export const parseEnv = (source: NodeJS.ProcessEnv): Env => Value.Parse(EnvSchema, source);

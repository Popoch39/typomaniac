import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const EnvSchema = Type.Object({
  VITE_API_URL: Type.String({ minLength: 1, default: "http://localhost:3000" }),
});

export type Env = typeof EnvSchema.static;

export const env: Env = Value.Parse(EnvSchema, import.meta.env);

import { z } from "zod";

const envSchema = {
  server: z.object({
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().optional(),
    OPENAI_API_KEY: z.string().min(1),
  }),
  client: z.object({
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  }),
};

const merged = envSchema.server.merge(envSchema.client);

const processEnvValues = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
} as const;

if (!process.env.SKIP_ENV_VALIDATION) {
  try {
    merged.parse(processEnvValues);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `❌ Invalid environment variables:\n${error.flatten().fieldErrors}\n` +
          "💡 Tip: Check your .env file"
      );
    }
  }
}

export const env = {
  ...processEnvValues,
  isProduction: processEnvValues.NODE_ENV === "production",
  isDevelopment: processEnvValues.NODE_ENV === "development",
  isTest: processEnvValues.NODE_ENV === "test",
} as const;

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { rawDb, schema } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(rawDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      timezone: { type: "string", required: false, defaultValue: "Asia/Shanghai", input: true },
    },
  },
  plugins: [nextCookies()],
});

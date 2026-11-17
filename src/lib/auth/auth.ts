import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { rawDb, schema } from "@/lib/db";

/**
 * Extra origins allowed to call auth endpoints (CSRF origin check), e.g. a reverse proxy.
 * BETTER_AUTH_URL is always trusted. Comma-separated: TRUSTED_ORIGINS=https://a.com,https://b.com
 */
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

export const auth = betterAuth({
  trustedOrigins,
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

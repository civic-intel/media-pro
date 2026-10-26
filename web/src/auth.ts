import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import argon2 from "argon2";
import { pool } from "@/lib/db/pool";
import { createAppAdapter } from "@/lib/auth/adapter";
import {
  getSessionVersion,
  isSessionVersionCurrent,
} from "@/lib/auth/session-version";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({

  adapter: createAppAdapter(pool),

  // Credentials authentication requires JWT sessions.
  session: {
    strategy: "jwt",
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        const result = await pool.query<{
          id: number;
          name: string | null;
          email: string;
          password_hash: string | null;
          emailVerified: Date | null;
        }>(
          `SELECT id, name, email, password_hash, "emailVerified"
           FROM users
           WHERE LOWER(email) = $1
           LIMIT 1`,
          [email],
        );

        const user = result.rows[0];

        if (!user?.password_hash || !user.emailVerified) return null;

        const validPassword = await argon2.verify(
          user.password_hash,
          parsed.data.password,
        );

        if (!validPassword) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const sessionVersion = await getSessionVersion(user.id);
        if (sessionVersion === null) return null;

        token.userId = user.id;
        token.sessionVersion = sessionVersion;
        return token;
      }

      if (
        typeof token.userId !== "string" ||
        typeof token.sessionVersion !== "number"
      ) {
        return null;
      }

      const isCurrent = await isSessionVersionCurrent(
        token.userId,
        token.sessionVersion,
      );

      if (!isCurrent) return null;

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
});

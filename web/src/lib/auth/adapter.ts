import "server-only";

import type { Adapter, AdapterUser } from "@auth/core/adapters";
import PostgresAdapter from "@auth/pg-adapter";
import type { Pool } from "pg";

function normalizeUser(user: AdapterUser | null): AdapterUser | null {
  if (!user) return null;

  return {
    ...user,
    id: String(user.id),
  };
}

export function createAppAdapter(pool: Pool): Adapter {
  const adapter = PostgresAdapter(pool);

  return {
    ...adapter,

    async createUser(user) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const result = await client.query<{
          id: number;
          name: string | null;
          email: string;
          emailVerified: Date | null;
          image: string | null;
        }>(
          `INSERT INTO users (name, email, "emailVerified", image)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, email, "emailVerified", image`,
          [user.name, user.email, user.emailVerified, user.image],
        );

        const createdUser = result.rows[0];

        if (!createdUser) {
          throw new Error("User creation returned no record.");
        }

        await client.query(
          `INSERT INTO user_plan_assignments
             (user_id, plan_code, status, assignment_source, valid_from, valid_until)
           VALUES ($1, 'member', 'active', 'registration', NOW(), NULL)`,
          [createdUser.id],
        );

        await client.query("COMMIT");

        return {
          ...createdUser,
          id: String(createdUser.id),
        } satisfies AdapterUser;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // Preserve the original database error.
        }

        throw error;
      } finally {
        client.release();
      }
    },

    async getUser(id) {
      const user = await adapter.getUser!(id);
      return normalizeUser(user);
    },

    async getUserByEmail(email) {
      const user = await adapter.getUserByEmail!(email);
      return normalizeUser(user);
    },

    async getUserByAccount(account) {
      const user = await adapter.getUserByAccount!(account);
      return normalizeUser(user);
    },

    async updateUser(user) {
      const updatedUser = await adapter.updateUser!(user);
      return {
        ...updatedUser,
        id: String(updatedUser.id),
      };
    },
  };
}

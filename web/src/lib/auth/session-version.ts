import "server-only";

import { pool } from "@/lib/db/pool";

export async function getSessionVersion(userId: string): Promise<number | null> {
  const result = await pool.query<{ session_version: number }>(
    `SELECT session_version
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const row = result.rows[0];

  if (!row || !Number.isSafeInteger(row.session_version)) {
    return null;
  }

  return row.session_version;
}

export async function isSessionVersionCurrent(
  userId: string,
  sessionVersion: number,
): Promise<boolean> {
  if (!Number.isSafeInteger(sessionVersion) || sessionVersion < 0) {
    return false;
  }

  const currentVersion = await getSessionVersion(userId);

  return currentVersion !== null && currentVersion === sessionVersion;
}

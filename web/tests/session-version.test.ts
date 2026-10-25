import { afterEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("@/lib/db/pool", () => ({
  pool: { query },
}));

import {
  getSessionVersion,
  isSessionVersionCurrent,
} from "@/lib/auth/session-version";

afterEach(() => {
  vi.clearAllMocks();
});

describe("session version", () => {
  it("returns the current version for an existing user", async () => {
    query.mockResolvedValueOnce({
      rows: [{ session_version: 0 }],
    });

    await expect(getSessionVersion("42")).resolves.toBe(0);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $1"),
      ["42"],
    );
  });

  it("accepts a matching session version", async () => {
    query.mockResolvedValueOnce({
      rows: [{ session_version: 3 }],
    });

    await expect(isSessionVersionCurrent("42", 3)).resolves.toBe(true);
  });

  it("rejects a stale session version", async () => {
    query.mockResolvedValueOnce({
      rows: [{ session_version: 4 }],
    });

    await expect(isSessionVersionCurrent("42", 3)).resolves.toBe(false);
  });

  it("rejects a session belonging to a deleted user", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(isSessionVersionCurrent("42", 0)).resolves.toBe(false);
  });

  it("rejects an invalid version without querying the database", async () => {
    await expect(
      isSessionVersionCurrent("42", -1),
    ).resolves.toBe(false);

    await expect(
      isSessionVersionCurrent("42", Number.NaN),
    ).resolves.toBe(false);

    expect(query).not.toHaveBeenCalled();
  });
});

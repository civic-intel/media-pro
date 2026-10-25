import { afterEach, describe, expect, it, vi } from "vitest";

const { nextAuth, getSessionVersion, isSessionVersionCurrent, captured } =
  vi.hoisted(() => ({
    nextAuth: vi.fn(),
    getSessionVersion: vi.fn(),
    isSessionVersionCurrent: vi.fn(),
    captured: { config: null as unknown },
  }));

vi.mock("next-auth", () => ({
  default: (config: unknown) => {
    captured.config = config;
    nextAuth(config);
    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({ id: "credentials" })),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google" })),
}));

vi.mock("argon2", () => ({
  default: { verify: vi.fn() },
}));

vi.mock("@/lib/db/pool", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("@/lib/auth/adapter", () => ({
  createAppAdapter: vi.fn(() => ({})),
}));

vi.mock("@/lib/auth/session-version", () => ({
  getSessionVersion,
  isSessionVersionCurrent,
}));

import "@/auth";

afterEach(() => {
  vi.clearAllMocks();
});

function getJwtCallback() {
  const config = captured.config as { callbacks?: { jwt?: unknown } } | null;
  const callback = config?.callbacks?.jwt;

  if (typeof callback !== "function") {
    throw new Error("Auth.js JWT callback was not configured.");
  }

  return callback;
}

describe("Auth.js JWT session-version enforcement", () => {
  it("stores the current version when a user signs in", async () => {
    getSessionVersion.mockResolvedValueOnce(2);

    const token = { sub: "42" };
    const result = await getJwtCallback()({
      token,
      user: { id: "42" },
    });

    expect(result).toMatchObject({
      userId: "42",
      sessionVersion: 2,
    });
    expect(getSessionVersion).toHaveBeenCalledWith("42");
  });

  it("rejects sign-in if the user no longer exists", async () => {
    getSessionVersion.mockResolvedValueOnce(null);

    const result = await getJwtCallback()({
      token: { sub: "42" },
      user: { id: "42" },
    });

    expect(result).toBeNull();
  });

  it("accepts a JWT whose session version is current", async () => {
    isSessionVersionCurrent.mockResolvedValueOnce(true);

    const token = {
      userId: "42",
      sessionVersion: 3,
    };

    const result = await getJwtCallback()({ token });

    expect(result).toBe(token);
    expect(isSessionVersionCurrent).toHaveBeenCalledWith("42", 3);
  });

  it("rejects a JWT invalidated by a password reset", async () => {
    isSessionVersionCurrent.mockResolvedValueOnce(false);

    const result = await getJwtCallback()({
      token: {
        userId: "42",
        sessionVersion: 3,
      },
    });

    expect(result).toBeNull();
    expect(isSessionVersionCurrent).toHaveBeenCalledWith("42", 3);
  });

  it("rejects tokens missing session-version claims", async () => {
    const result = await getJwtCallback()({
      token: { userId: "42" },
    });

    expect(result).toBeNull();
    expect(isSessionVersionCurrent).not.toHaveBeenCalled();
  });
});

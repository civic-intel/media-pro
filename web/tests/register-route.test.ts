import { afterEach, describe, expect, it, vi } from "vitest";

const { registerUser } = vi.hoisted(() => ({
  registerUser: vi.fn(),
}));

vi.mock("@/lib/auth/register", () => ({
  registerUser,
}));

import { POST } from "@/app/api/auth/register/route";

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("creates an account with a generic registration response", async () => {
    registerUser.mockResolvedValue({
      success: true,
      verificationEmailSent: true,
    });

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "a-secure-password-123",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message:
        "If registration can proceed for this address, instructions will be sent by email.",
    });
    expect(registerUser).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      password: "a-secure-password-123",
    });
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "not-an-email",
        password: "a-secure-password-123",
      }),
    );

    expect(response.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 12 characters", async () => {
    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("handles an unavailable email without exposing account details", async () => {
    registerUser.mockResolvedValue({
      success: false,
      reason: "email_unavailable",
    });

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "a-secure-password-123",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "If registration can proceed for this address, instructions will be sent by email.",
    });
  });

  it("reports a generic server error if registration throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    registerUser.mockRejectedValue(
      new Error("Sensitive database details"),
    );

    const response = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "a-secure-password-123",
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();

    expect(body.error).toBe(
      "Registration is temporarily unavailable. Please try again.",
    );
    expect(JSON.stringify(body)).not.toContain("Sensitive database details");

    consoleError.mockRestore();
  });
});

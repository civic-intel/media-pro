import { afterEach, describe, expect, it, vi } from "vitest";

const { resetPassword } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock("@/lib/auth/reset-password", () => ({
  resetPassword,
}));

import { POST } from "@/app/api/auth/reset-password/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  email: "test@example.com",
  code: "012345",
  password: "a-long-secure-password",
};

afterEach(() => vi.clearAllMocks());

describe("POST /api/auth/reset-password", () => {
  it("passes valid reset details to the service", async () => {
    resetPassword.mockResolvedValue({ success: true });

    const response = await POST(makeRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("reset");
    expect(resetPassword).toHaveBeenCalledWith(validPayload);
  });

  it("rejects codes that are not exactly six digits", async () => {
    for (const code of ["12345", "1234567", "12a456", ""]) {
      const response = await POST(makeRequest({ ...validPayload, code }));
      expect(response.status).toBe(400);
    }

    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("rejects passwords outside the permitted length", async () => {
    for (const password of ["short", "x".repeat(129)]) {
      const response = await POST(makeRequest({ ...validPayload, password }));
      expect(response.status).toBe(400);
    }

    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("returns a generic error for an invalid or expired code", async () => {
    resetPassword.mockResolvedValue({
      success: false,
      reason: "invalid_code",
    });

    const response = await POST(makeRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("invalid, expired or no longer usable");
  });

  it("returns a server error when the service throws", async () => {
    resetPassword.mockRejectedValue(new Error("internal failure"));

    const response = await POST(makeRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("temporarily unavailable");
  });
});

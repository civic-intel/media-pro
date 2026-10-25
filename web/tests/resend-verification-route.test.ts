import { afterEach, describe, expect, it, vi } from "vitest";

const { resendVerificationEmail } = vi.hoisted(() => ({
  resendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/auth/resend-verification", () => ({
  resendVerificationEmail,
}));

import { POST } from "@/app/api/auth/resend-verification/route";

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/resend-verification", () => {
  it("returns a generic success message for a valid email", async () => {
    resendVerificationEmail.mockResolvedValue(undefined);

    const response = await POST(
      makeRequest({ email: "test@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message:
        "If an unverified account exists for this address, a verification email will be sent.",
    });
    expect(resendVerificationEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("rejects an invalid email", async () => {
    const response = await POST(makeRequest({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request(
      "http://localhost/api/auth/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid-json",
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns a generic error if the service throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    resendVerificationEmail.mockRejectedValue(
      new Error("Sensitive database details"),
    );

    const response = await POST(
      makeRequest({ email: "test@example.com" }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();

    expect(body.error).toBe(
      "Unable to process your request right now. Please try again.",
    );
    expect(JSON.stringify(body)).not.toContain("Sensitive database details");

    consoleError.mockRestore();
  });
});

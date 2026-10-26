import { afterEach, describe, expect, it, vi } from "vitest";

const { requestPasswordReset } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("@/lib/auth/request-password-reset", () => ({
  requestPasswordReset,
}));

import { POST } from "@/app/api/auth/request-password-reset/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/request-password-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.clearAllMocks());

describe("POST /api/auth/request-password-reset", () => {
  it("returns a generic success response for a valid email", async () => {
    requestPasswordReset.mockResolvedValue(undefined);

    const response = await POST(makeRequest({ email: "test@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("If an account");
    expect(requestPasswordReset).toHaveBeenCalledWith("test@example.com");
  });

  it("returns the same generic success when the service fails", async () => {
    requestPasswordReset.mockRejectedValue(new Error("database failure"));

    const response = await POST(makeRequest({ email: "test@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("If an account");
  });

  it("rejects an invalid email without calling the service", async () => {
    const response = await POST(makeRequest({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request(
      "http://localhost/api/auth/request-password-reset",
      { method: "POST", body: "{" },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});

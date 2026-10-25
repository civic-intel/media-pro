import { afterEach, describe, expect, it, vi } from "vitest";

const { connect, query, release, createAuthActionToken, sendAuthEmail } =
  vi.hoisted(() => ({
    connect: vi.fn(),
    query: vi.fn(),
    release: vi.fn(),
    createAuthActionToken: vi.fn(),
    sendAuthEmail: vi.fn(),
  }));

vi.mock("@/lib/db/pool", () => ({
  pool: { connect },
}));

vi.mock("@/lib/auth/tokens", () => ({
  createAuthActionToken,
}));

vi.mock("@/lib/email/resend", () => ({
  sendAuthEmail,
}));

import { resendVerificationEmail } from "@/lib/auth/resend-verification";

function setupClient() {
  const client = {
    query,
    release,
  };

  connect.mockResolvedValue(client);
  query.mockResolvedValue({ rows: [] });
  return client;
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("resendVerificationEmail", () => {
  it("creates a token and sends email for an unverified account", async () => {
    setupClient();
    process.env.NEXT_PUBLIC_SITE_URL = "https://adlas.example";
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 42, name: "Test User" }] }); // SELECT
    createAuthActionToken.mockResolvedValue("test-token");

    await resendVerificationEmail("Test@Example.com");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"emailVerified" IS NULL'),
      ["test@example.com"],
    );
    expect(createAuthActionToken).toHaveBeenCalledWith(
      expect.anything(),
      { userId: 42, purpose: "email_verification" },
    );
    expect(sendAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Verify your Adlas email address",
        text: expect.stringContaining(
          "https://adlas.example/verify-email?token=test-token",
        ),
      }),
    );
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not send email for an unknown or verified account", async () => {
    setupClient();
    query.mockResolvedValueOnce({ rows: [] });

    await resendVerificationEmail("unknown@example.com");

    expect(createAuthActionToken).not.toHaveBeenCalled();
    expect(sendAuthEmail).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledOnce();
  });

  it("ignores invalid email input without connecting to the database", async () => {
    await resendVerificationEmail("not-an-email");

    expect(connect).not.toHaveBeenCalled();
    expect(sendAuthEmail).not.toHaveBeenCalled();
  });

  it("rolls back and releases the connection if the database query fails", async () => {
    setupClient();
    query.mockRejectedValueOnce(new Error("database failure"));

    await expect(
      resendVerificationEmail("test@example.com"),
    ).rejects.toThrow("database failure");

    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
    expect(sendAuthEmail).not.toHaveBeenCalled();
  });

  it("escapes HTML-sensitive characters in the greeting", async () => {
    setupClient();
    process.env.NEXT_PUBLIC_SITE_URL = "https://adlas.example";
    query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 43, name: '<script>alert("x")</script> & "Adlas"' }],
      }); // SELECT
    createAuthActionToken.mockResolvedValue("safe-test-token");

    await resendVerificationEmail("test@example.com");

    expect(sendAuthEmail).toHaveBeenCalledOnce();
    const email = sendAuthEmail.mock.calls[0][0];

    expect(email.html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &quot;Adlas&quot;",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain(
      "https://adlas.example/verify-email?token=safe-test-token",
    );
  });

});

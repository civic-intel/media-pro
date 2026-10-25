import { afterEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("@/lib/db/pool", () => ({
  pool: { query },
}));

import { POST } from "@/app/api/contact/route";

afterEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validEnquiry = {
  title: "Dr",
  name: "Taylor Example",
  email: "TAYLOR@EXAMPLE.COM",
  company: "Example Transport",
  jobTitle: "Partnerships Manager",
  department: "Commercial",
  subject: "Media partnership enquiry",
  message: "I'd like to discuss transport media opportunities.",
};

describe("POST /api/contact", () => {
  it("saves a valid enquiry and returns 201", async () => {
    query.mockResolvedValue({ rowCount: 1, rows: [] });

    const response = await POST(makeRequest(validEnquiry));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      message: "Thank you. Your enquiry has been received.",
    });

    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO contact_enquiries"),
      [
        "Dr",
        "Taylor Example",
        "taylor@example.com",
        "Example Transport",
        "Partnerships Manager",
        "Commercial",
        "Media partnership enquiry",
        "I'd like to discuss transport media opportunities.",
      ],
    );
  });

  it("silently accepts honeypot submissions without saving them", async () => {
    const response = await POST(
      makeRequest({ ...validEnquiry, website: "https://spam.example" }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      message: "Thank you. Your enquiry has been received.",
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("accepts an enquiry without optional fields", async () => {
    query.mockResolvedValue({ rowCount: 1, rows: [] });

    const response = await POST(
      makeRequest({
        name: "Taylor Example",
        email: "taylor@example.com",
        company: "Example Transport",
        message: "Please contact me.",
      }),
    );

    expect(response.status).toBe(201);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO contact_enquiries"),
      [
        null,
        "Taylor Example",
        "taylor@example.com",
        "Example Transport",
        null,
        null,
        null,
        "Please contact me.",
      ],
    );
  });

  it("rejects a missing required field without querying the database", async () => {
    const { name: _name, ...missingName } = validEnquiry;

    const response = await POST(makeRequest(missingName));

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      makeRequest({ ...validEnquiry, email: "not-an-email" }),
    );

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an unsupported title", async () => {
    const response = await POST(
      makeRequest({ ...validEnquiry, title: "Captain" }),
    );

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns a generic error if the database insert fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    query.mockRejectedValue(new Error("Sensitive database details"));

    const response = await POST(makeRequest(validEnquiry));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      "We couldn't submit your enquiry right now. Please try again later.",
    );
    expect(JSON.stringify(body)).not.toContain("Sensitive database details");

    consoleError.mockRestore();
  });
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db/pool";


const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

const requestSchema = z.object({
  website: z.string().max(500).optional(),
  title: z
    .union([
      z.literal(""),
      z.enum(["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Other"]),
    ])
    .optional()
    .transform((value) => value || null),

  name: z.string().trim().min(1).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  company: z.string().trim().min(1).max(150),
  jobTitle: optionalText(100),
  department: optionalText(100),
  subject: optionalText(200),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please submit a valid contact form." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Please check your name, email, company and message, then try again.",
      },
      { status: 400 },
    );
  }

  // parsed.data is now safe to access.
  if (parsed.data.website?.trim()) {
    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your enquiry has been received.",
      },
      { status: 201 },
    );
  }

  const {
    title,
    name,
    email,
    company,
    jobTitle,
    department,
    subject,
    message,
  } = parsed.data;

  try {
    await pool.query(
      `INSERT INTO contact_enquiries
        (title, full_name, email, company, job_title, department, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [title, name, email, company, jobTitle, department, subject, message],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your enquiry has been received.",
      },
      { status: 201 },
    );
  } catch {
    console.error("Adlas contact enquiry could not be saved.");

    return NextResponse.json(
      {
        error:
          "We couldn't submit your enquiry right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}


"use client";

import { useState, type FormEvent } from "react";
import FormField from "@/components/forms/Form-Field";
import FormFeedback from "@/components/forms/Form-Feedback";
import styles from "./page.module.css";

export default function ContactForm() {
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"error" | "success">(
    "error",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = Object.fromEntries(formData.entries());

    setFeedback("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: { message?: string; error?: string } =
        await response.json();

      if (!response.ok) {
        setFeedbackType("error");
        setFeedback(
          result.error ?? "We couldn't submit your enquiry. Please try again.",
        );
        return;
      }

      setFeedbackType("success");
      setFeedback(result.message ?? "Your enquiry has been received.");
      form.reset();
    } catch {
      setFeedbackType("error");
      setFeedback(
        "We couldn't submit your enquiry. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className={styles.messageField}>
        <label htmlFor="contact-title">Title</label>
        <select id="contact-title" name="title" defaultValue="">
          <option value="">Select a title (optional)</option>
          <option value="Mr">Mr</option>
          <option value="Mrs">Mrs</option>
          <option value="Ms">Ms</option>
          <option value="Miss">Miss</option>
          <option value="Dr">Dr</option>
          <option value="Prof">Prof</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <FormField
        id="contact-name"
        name="name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={100}
      />

      <FormField
        id="contact-email"
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />

      <FormField
        id="contact-company"
        name="company"
        label="Company"
        autoComplete="organization"
        required
        maxLength={150}
      />

      <FormField
        id="contact-job-title"
        name="jobTitle"
        label="Job title"
        autoComplete="organization-title"
        maxLength={100}
      />

      <FormField
        id="contact-department"
        name="department"
        label="Department"
        maxLength={100}
      />

      <FormField
        id="contact-subject"
        name="subject"
        label="Subject"
        maxLength={200}
      />

      <div className={styles.messageField}>
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          maxLength={5000}
          placeholder="How can we help?"
        />
      </div>

      {feedback && (
        <FormFeedback type={feedbackType}>{feedback}</FormFeedback>
      )}

      <button
        className={styles.submitButton}
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}


"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(
          body.error ??
            "Unable to process your request. Please try again.",
        );
        return;
      }

      setNotice(
        body.message ??
          "If an account with that email supports password reset, instructions will be sent.",
      );
    } catch {
      setError("Unable to process your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        id="email"
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {error && <FormFeedback type="error">{error}</FormFeedback>}

      {notice && <FormFeedback type="success">{notice}</FormFeedback>}

      <SubmitButton
        loading={submitting}
        loadingLabel="Sending instructions..."
      >
        Send reset instructions
      </SubmitButton>

      <p>
        Remembered your password?{" "}
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}

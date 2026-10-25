
"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

type RegistrationResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  verificationEmailSent?: boolean;
};

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setMessage("Your password must contain at least 12 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = (await response.json()) as RegistrationResponse;

      if (!response.ok || !result.success) {
        setMessage(result.error ?? "We couldn't create your account.");
        return;
      }

      setSuccess(true);
      setMessage(
        result.message ??
          "Your account has been created. Please check your email.",
      );
    } catch {
      setMessage("We couldn't contact the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div role="status" aria-live="polite">
        <FormFeedback type="success">{message}</FormFeedback>
        <Link href="/login">Return to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        id="name"
        name="name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

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

      <FormField
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={128}
        required
        hint="Use at least 12 characters."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={128}
        error={
          confirmPassword && password !== confirmPassword
            ? "Your passwords do not match."
            : undefined
        }
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      {message && <FormFeedback type="error">{message}</FormFeedback>}

      <SubmitButton
        loading={submitting}
        loadingLabel="Creating account..."
      >
        Create account
      </SubmitButton>
    </form>
  );
}

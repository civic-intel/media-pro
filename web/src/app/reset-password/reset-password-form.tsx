"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

type ResetPasswordFormProps = {
  initialEmail: string;
};

export default function ResetPasswordForm({
  initialEmail,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your email.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Your password must be between 12 and 128 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code, password }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(
          body.error ?? "Unable to reset your password. Please try again.",
        );
        return;
      }

      setCode("");
      setPassword("");
      setConfirmation("");
      setNotice(
        body.message ?? "Your password has been reset. You can now sign in.",
      );
    } catch {
      setError("Password reset is temporarily unavailable. Please try again.");
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

      <FormField
        id="code"
        name="code"
        label="Six-digit reset code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        minLength={6}
        maxLength={6}
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\\D/g, "").slice(0, 6))
        }
        hint="Enter the code sent to your email. It expires after 10 minutes."
      />

      <FormField
        id="password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={128}
        required
        hint="Use between 12 and 128 characters."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <FormField
        id="confirmation"
        name="confirmation"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={128}
        required
        error={
          confirmation && password !== confirmation
            ? "The passwords do not match."
            : undefined
        }
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />

      {error && <FormFeedback type="error">{error}</FormFeedback>}

      {notice ? (
        <div>
          <FormFeedback type="success">{notice}</FormFeedback>
          <Link href="/login">Sign in</Link>
        </div>
      ) : (
        <SubmitButton loading={submitting} loadingLabel="Resetting password...">
          Reset password
        </SubmitButton>
      )}

      <p>
        Need a new code?{" "}
        <Link href="/forgot-password">Request another code</Link>
      </p>
    </form>
  );
}

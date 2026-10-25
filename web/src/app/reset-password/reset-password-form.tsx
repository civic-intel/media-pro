
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

type ResetPasswordFormProps = {
  token: string;
};

export default function ResetPasswordForm({
  token,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // Keep the reset token out of the visible URL and future browser history.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

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
        body: JSON.stringify({ token, password }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(
          body.error ??
            "Unable to reset your password. Please try again.",
        );
        return;
      }

      setPassword("");
      setConfirmation("");
      setNotice(
        body.message ??
          "Your password has been reset. You can now sign in.",
      );
    } catch {
      setError(
        "Password reset is temporarily unavailable. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div>
        <FormFeedback type="error">
          This password-reset link is missing its token. Request a new link to
          continue.
        </FormFeedback>

        <Link href="/forgot-password">Request a new reset link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
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
        <SubmitButton
          loading={submitting}
          loadingLabel="Resetting password..."
        >
          Reset password
        </SubmitButton>
      )}

      <p>
        <Link href="/forgot-password">Request a new reset link</Link>
      </p>
    </form>
  );
}

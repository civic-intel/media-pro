
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Unable to sign in. Check your credentials and verify your email address.",
        );
        return;
      }

      const requestedCallback = new URLSearchParams(
        window.location.search,
      ).get("callbackUrl");

      let destination = "/dashboard";

      if (requestedCallback) {
        try {
          const callback = new URL(
            requestedCallback,
            window.location.origin,
          );

          if (callback.origin === window.location.origin) {
            destination =
              callback.pathname + callback.search + callback.hash;
          }
        } catch {
          // Keep the safe default destination.
        }
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setError("");
    setNotice("");

    const normalizedEmail = email.trim();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Enter your email address above first.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(
          body.error ??
            "Unable to process your request right now. Please try again.",
        );
        return;
      }

      setNotice(
        body.message ??
          "If an unverified account exists for this address, a verification email will be sent.",
      );
    } catch {
      setError("Unable to process your request right now. Please try again.");
    } finally {
      setResending(false);
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
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        action={
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending || submitting}
          >
            {resending
              ? "Sending verification email..."
              : "Resend verification email"}
          </button>
        }
      />

      {error && <FormFeedback type="error">{error}</FormFeedback>}

      {notice && <FormFeedback type="success">{notice}</FormFeedback>}

      <p>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>

      <SubmitButton
        loading={submitting}
        disabled={resending}
        loadingLabel="Signing in..."
      >
        Sign in
      </SubmitButton>
    </form>
  );
}

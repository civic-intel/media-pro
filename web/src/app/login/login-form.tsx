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
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

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

      const requestedCallback = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );

      let destination = "/dashboard";

      if (requestedCallback) {
        try {
          const callback = new URL(requestedCallback, window.location.origin);

          if (callback.origin === window.location.origin) {
            destination = callback.pathname + callback.search + callback.hash;
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

  async function handleOAuthSignIn(provider: "google" | "github") {
    setError("");
    setSubmitting(true);

    try {
      const requestedCallback = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );

      let destination = "/dashboard";

      if (requestedCallback) {
        try {
          const callback = new URL(requestedCallback, window.location.origin);

          if (callback.origin === window.location.origin) {
            destination = callback.pathname + callback.search + callback.hash;
          }
        } catch {
          // Keep the safe default destination.
        }
      }

      await signIn(provider, { callbackUrl: destination });
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="oauth-sign-in" aria-label="Other sign-in options">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={submitting}
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuthSignIn("github")}
          disabled={submitting}
        >
          Continue with GitHub
        </button>
      </div>

      <p>Or sign in with your email address</p>

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
        />

        {error && <FormFeedback type="error">{error}</FormFeedback>}

        <p>
          <Link href="/forgot-password">Forgot password?</Link>
        </p>

        <SubmitButton loading={submitting} loadingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>
    </>
  );
}

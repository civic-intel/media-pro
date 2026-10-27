"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import FormFeedback from "@/components/forms/Form-Feedback";
import FormField from "@/components/forms/Form-Field";
import SubmitButton from "@/components/buttons/Submit-Button";

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width="20"
      height="20"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 17.9l6.8-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.2 11.4-8.2Z"
      />
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      focusable="false"
      fill="currentColor"
    >
      <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6.1 0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.3a11.8 11.8 0 0 1 6.2 0c2.4-1.6 3.4-1.3 3.4-1.3.6 1.7.2 3 .1 3.3.8.9 1.2 2 1.2 3.4 0 4.7-2.8 5.8-5.5 6.1.4.4.8 1 .8 2v3.4c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

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

      <div className="oauth-sign-in" aria-label="Other sign-in options">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={submitting}
        >
          <GoogleLogo />
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuthSignIn("github")}
          disabled={submitting}
        >
          <GitHubLogo />
          <span>GitHub</span>
        </button>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

import AuthLayout from "@/components/auth/Auth-Layout";
import SubmitButton from "@/components/buttons/Submit-Button";
import FormFeedback from "@/components/forms/Form-Feedback";
import styles from "@/components/forms/auth.module.css";

type VerificationState = "ready" | "submitting" | "success" | "error";

export default function VerifyEmailForm({ token }: { token: string }) {
  const [state, setState] = useState<VerificationState>(
    token ? "ready" : "error",
  );

  const [message, setMessage] = useState(
    token
      ? ""
      : "This verification link is missing its token. Please request a new email.",
  );

  async function handleVerify() {
    if (!token || state === "submitting" || state === "success") {
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result: { success?: boolean; error?: string } =
        await response.json();

      if (!response.ok || !result.success) {
        setState("error");
        setMessage(
          result.error ??
            "This link is invalid or has expired. Please request a new one.",
        );
        return;
      }

      setState("success");
      setMessage("Your email address has been verified successfully.");
    } catch {
      setState("error");
      setMessage(
        "We couldn't contact the server. Please check your connection and try again.",
      );
    }
  }

  return (
    <AuthLayout
      eyebrow="Adlas account"
      title="Verify your email"
      description="Confirm your email address to finish setting up your Adlas account."
    >
      <div className={styles.form}>
        {message && (
          <FormFeedback type={state === "success" ? "success" : "error"}>
            {message}
          </FormFeedback>
        )}

        {state !== "success" && (
          <SubmitButton
            type="button"
            onClick={handleVerify}
            disabled={!token || state === "submitting"}
            loading={state === "submitting"}
            loadingLabel="Verifying..."
          >
            {state === "error" ? "Try verification again" : "Verify email"}
          </SubmitButton>
        )}

        {state === "success" && (
          <Link className={styles.formLink} href="/login">
            Continue to sign in
          </Link>
        )}

        <p className={styles.hint}>
          Verification links expire after 24 hours and can only be used once.
        </p>
      </div>
    </AuthLayout>
  );
}

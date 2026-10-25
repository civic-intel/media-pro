
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "../auth.module.css";
import ResetPasswordForm from "./reset-password-form";

export const metadata = buildPageMetadata({
  title: "Choose a new password",
  description: "Set a new password for your Adlas account.",
  path: "/reset-password",
  index: false,
});

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

async function ResetPasswordContent({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Adlas account</p>

        <h1 className={styles.title}>Set a new password</h1>

        <p className={styles.description}>
          Choose a new password for your account. Reset links expire after one
          hour and can only be used once.
        </p>

        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.card}>
            <p className={styles.fallbackText}>
              Loading password reset form…
            </p>
          </section>
        </main>
      }
    >
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

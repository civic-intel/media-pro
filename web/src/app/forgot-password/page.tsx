
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "../auth.module.css";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata = buildPageMetadata({
  title: "Reset your password",
  description: "Request a secure password-reset link for your Adlas account.",
  path: "/forgot-password",
  index: false,
});

export default function ForgotPasswordPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Adlas account</p>

        <h1 className={styles.title}>Forgot your password?</h1>

        <p className={styles.description}>
          Enter the email address associated with your account. If password
          reset is available for that account, we&apos;ll send you instructions.
        </p>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}

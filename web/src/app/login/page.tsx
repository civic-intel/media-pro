import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Sign in to Adlas",
  description: "Sign in to your Adlas account.",
  path: "/login",
  index: false,
});


import Link from "next/link";
import styles from "../auth.module.css";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Adlas account</p>

        <h1 className={styles.title}>Welcome back</h1>

        <p className={styles.description}>
          Sign in to continue to your advertising intelligence dashboard.
        </p>

        <LoginForm />

        <p className={styles.footer}>
          New to Adlas?{" "}
          <Link className={styles.link} href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

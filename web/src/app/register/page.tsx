import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Create an Adlas account",
  description: "Create an account to access Adlas transport media interoperability tools.",
  path: "/register",
  index: false,
});


import Link from "next/link";
import styles from "../auth.module.css";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Adlas account</p>

        <h1 className={styles.title}>Create your account</h1>

        <p className={styles.description}>
          Start exploring advertising intelligence with Adlas.
        </p>

        <RegisterForm />

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link className={styles.link} href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

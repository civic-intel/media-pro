"use client";

import Link from "next/link";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.wordmark} href="/" aria-label="Adlas home">
        <span className={styles.logoMark} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>
          adlas<span className={styles.wordmarkDot}>.</span>
        </span>
      </Link>

      <span className={styles.tagline}>
        Transport media data, connected.
      </span>

      <a className={styles.contact} href="/contact">
        Contact <span aria-hidden="true">↗</span>
      </a>

      <span className={styles.copyright}>
        © Adlas, 2026
      </span>
    </footer>
  );
}

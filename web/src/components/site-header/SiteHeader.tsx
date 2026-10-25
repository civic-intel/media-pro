"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";
import MobileNavigation from "@/components/mobile navigation/MobileNavigation";

export default function SiteHeader() {
  const pathname = usePathname();

  const isSolutionsPage = pathname === "/solutions";
  const isMarketIntelligencePage =
    pathname === "/solutions/market-intelligence";

  return (
    <header className={styles.header}>
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

      <nav className={styles.nav} aria-label="Main navigation">
        {!isSolutionsPage && (
          <Link href="/solutions">Solutions</Link>
        )}

        {!isMarketIntelligencePage && (
          <Link href="/solutions/market-intelligence">
            Market Intelligence
          </Link>
        )}

        {!pathname.startsWith("/insights") && (
          <Link href="/insights/commercial-value-of-connected-data/">
            Insights
          </Link>
        )}

        {pathname !== "/login" && (
          <Link href="/login">Login</Link>
        )}

        {pathname !== "/register" && (
          <Link href="/register">Register</Link>
        )}

        {pathname !== "/contact" && (
          <Link className={styles.headerAction} href="/contact">
            Contact <span aria-hidden="true">↗</span>
          </Link>
        )}
      </nav>

      <MobileNavigation />
    </header>
  );
}

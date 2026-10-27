"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./MobileNavigation.module.css";

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className={styles.mobileNavigation}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{isOpen ? "Close" : "Menu"}</span>
        <span className={styles.icon} aria-hidden="true">
          {isOpen ? "×" : "☰"}
        </span>
      </button>

      {isOpen && (
        <nav
          id="mobile-navigation-menu"
          className={styles.menu}
          aria-label="Mobile navigation"
        >
          <Link href="/#platform" onClick={closeMenu}>
            Platform
          </Link>
          <Link href="/#capabilities" onClick={closeMenu}>
            Capabilities
          </Link>
          <Link
            href="/solutions/transport-media-inventory-data-integration/"
            onClick={closeMenu}
          >
            Data integration
          </Link>
          <Link
            href="/insights/commercial-value-of-connected-data/"
            onClick={closeMenu}
          >
            Insights
          </Link>
          <Link href="/#approach" onClick={closeMenu}>
            Our approach
          </Link>
          <a href="mailto:hello@adlas.pro" onClick={closeMenu}>
            Get in touch
          </a>
        </nav>
      )}
    </div>
  );
}

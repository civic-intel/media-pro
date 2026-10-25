import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "./page.module.css";
import ContactForm from "./ContactForm";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Adlas | Transport Media Data Integration",
  description:
    "Contact Adlas about transport media interoperability, data integration and commercial media partnerships.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>CONTACT</p>
        <h1>Let&apos;s connect.</h1>
        <p className={styles.lead}>
          Get in touch to discuss transport media data integration,
          interoperability and commercial media partnerships.
        </p>
      </section>

      <div className={styles.sections}>
        <section className={styles.contactSection} aria-labelledby="contact-heading">
          <h2 id="contact-heading">Contact</h2>
          <p className={styles.sectionIntro}>
            Reach us using the details below.
          </p>

          <dl className={styles.details}>
            <div className={styles.detail}>
              <dt>Postal address</dt>
              <dd>
                <address>
                  [Business address]
                  <br />
                  [Town or city]
                  <br />
                  [Postcode]
                  <br />
                  United Kingdom
                </address>
              </dd>
            </div>

            <div className={styles.detail}>
              <dt>Telephone</dt>
              <dd>
                <a href="tel:[TELEPHONE_NUMBER]">
                  [Telephone number]
                </a>
              </dd>
            </div>

            <div className={styles.detail}>
              <dt>Email</dt>
              <dd>
                <a href="mailto:hello@adlas.pro">hello@adlas.pro</a>
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.emailSection} aria-labelledby="email-heading">
          <h2 id="email-heading">Email</h2>
          <p className={styles.sectionIntro}>
            Send us a message using the form below.
          </p>

          <ContactForm />

          <p className={styles.privacyNote}>
            Please avoid including passwords or other sensitive information
            in your message. Read our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "./solutions.module.css";

export const metadata = buildPageMetadata({
  title: "Transport Media Interoperability Solutions",
  description:
    "Explore how Adlas supports interoperability between transport operators and out-of-home media partners, helping align commercial media estate information, inventory data and existing systems.",
  path: "/solutions/",
});

export default function SolutionsPage() {
  return (
    <main className={styles.page} aria-label="Adlas solutions">
      <article className={styles.article} aria-labelledby="page-title">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Solutions" }]}
        />

        <div className={styles.content}>
          <section className={styles.hero} aria-labelledby="page-title">
            <p className={styles.eyebrow}>ADLAS / SOLUTIONS</p>

            <h1 id="page-title">
              Transport media interoperability for existing commercial estates
            </h1>

            <p>
              Transport operators manage commercial media assets across
              established estates, systems and media-partner arrangements.
              Exchanging consistent information across those environments can be
              difficult when inventory structures, attributes and reporting
              formats differ.
            </p>

            <p>
              Adlas is being developed as an interoperability platform to help
              operators and their existing out-of-home (OOH) advertising media
              partners exchange governed, consistent transport-media information
              without requiring wholesale replacement of their existing
              platforms or contractual arrangements.
            </p>
          </section>

          <section
            className={`${styles.section} ${styles.hero}`}
            aria-labelledby="commercial-estate"
          >
            <h2 id="commercial-estate">
              Make commercial estate information easier to use
            </h2>

            <p>
              A consistent view of commercial media assets and inventory
              information can help authorised teams understand what information
              is available, improve reporting consistency and explore relevant
              cross-network commercial opportunities.
            </p>

            <ul>
              <li>
                <strong>Estate and inventory data:</strong> align asset
                identifiers, attributes and availability information.
              </li>
              <li>
                <strong>Media-partner integration:</strong> reduce avoidable
                differences in how operator and concessionaire systems exchange
                information.
              </li>
              <li>
                <strong>Cross-network opportunities:</strong> make compatible
                information easier to exchange between participating parties,
                subject to permissions and commercial agreements.
              </li>
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="integration">
            <h2 id="integration">Integrate with existing systems</h2>

            <p>
              Adlas is intended to complement existing operator systems and
              media sales platforms, not replace them. Reusable integrations and
              a shared canonical data model provide a foundation for consistent
              information exchange across different technical environments.
            </p>

            <Link
              className={styles.textLink}
              href="/solutions/transport-media-inventory-data-integration/"
              aria-label="Explore transport media data integration solutions"
            >
              Explore transport media data integration
            </Link>
          </section>

          <section className={styles.section} aria-labelledby="governance">
            <h2 id="governance">Governance, provenance and traceability</h2>

            <p>
              Commercial information must be exchanged in line with agreed
              access rights and responsibilities. Adlas&apos;s intended approach
              includes permission-controlled data access, traceable provenance
              and auditable exchange, subject to the capabilities implemented
              and the agreements governing each integration.
            </p>
          </section>

          <section className={styles.contactSection} aria-labelledby="contact">
            <h2 id="contact">Discuss your interoperability requirements</h2>

            <p>
              For transport operators and OOH media partners evaluating
              commercial estate data integration, contact Adlas to discuss your
              existing systems and information-exchange requirements.
            </p>

            <Link
              className={styles.contactButton}
              href="/contact"
              aria-label="Email Adlas about transport media interoperability"
            >
              Contact Adlas
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}

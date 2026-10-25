import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "../solutions.module.css";

export const metadata = buildPageMetadata({
  title: "Transport Media Inventory Data Integration",
  description:
    "Discover how structured transport media inventory data and reusable integrations can help operators and out-of-home media partners coordinate commercial media opportunities.",
  path: "/solutions/market-intelligence/",
});

export default function TransportMediaIntegrationPage() {
  return (
    <main className={styles.page} aria-label="Transport media data integration">
      <article
        className={styles.article}
        aria-labelledby="page-title"
      >
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Solutions", href: "/solutions/" },
            { label: "Transport media data integration" },
          ]}
        />

        <section
          className={`${styles.section} ${styles.hero}`}
          aria-labelledby="page-title"
        >
          <p className={styles.eyebrow}>
            TRANSPORT MEDIA DATA INTEGRATION
          </p>

          <h1 id="page-title">
            Standardise transport media data across existing systems
          </h1>

          <p>
            Transport advertising estates can span multiple asset types,
            operational systems and out-of-home (OOH) media partners.
            Differences in identifiers, inventory attributes and data formats
            make it harder to exchange consistent commercial information.
          </p>

          <p>
            Adlas is being developed to provide an interoperability layer
            between participating transport operators and their existing
            media partners. The objective is to make commercial media
            information easier to exchange without requiring a wholesale
            replacement of the systems already in use.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="canonical-model"
        >
          <h2 id="canonical-model">
            A shared canonical data model
          </h2>

          <p>
            A canonical data model defines a consistent structure for
            information exchanged between different systems. Instead of
            requiring every participant to adopt the same internal data
            structure, integrations can map local formats to a shared model.
          </p>

          <p>
            For transport media, the model can be designed around agreed
            identifiers and attributes for commercial assets, inventory,
            availability and relevant partner relationships. The actual
            fields and validation rules must be established with participating
            operators and partners.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="reusable-apis"
        >
          <h2 id="reusable-apis">Scalable & Reusable API integrations</h2>

          <p>
            Scalable & Reusable API integrations provide a consistent way for authorised
            systems to exchange information. A documented integration
            contract can define the data structure, validation behaviour,
            access permissions and expected responses.
          </p>

          <ul>
            <li>Documented API contracts and data formats.</li>
            <li>
              Mapping between existing partner systems and shared fields.
            </li>
            <li>Consistent validation and error handling.</li>
            <li>Versioning to support changes over time.</li>
          </ul>

          <p>
            Integration methods will depend on each participant&apos;s existing
            systems, available interfaces and agreed technical requirements.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="inventory-standardisation"
        >
          <h2 id="inventory-standardisation">
            Advertising inventory standardisation
          </h2>

          <p>
            Consistent inventory data can help commercial teams interpret
            transport media assets across participating networks. Agreed
            attributes may describe asset type, location references,
            format, availability and other commercially relevant properties.
          </p>

          <p>
            Standardisation does not itself guarantee that inventory is
            available for sale. Availability, pricing, rights and commercial
            terms remain subject to the source system, responsible media
            partner and applicable agreements.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="governed-exchange"
        >
          <h2 id="governed-exchange">
            Permission-controlled data exchange
          </h2>

          <p>
            Commercial media data can be sensitive or contractually
            restricted. An interoperability platform must account for who
            can access particular information, the purpose of access and
            the provenance of exchanged data.
          </p>

          <p>
            Adlas&apos;s intended design includes rights-based access controls,
            traceable data provenance and auditable exchange. The exact
            controls and audit coverage will depend on the implemented
            capabilities and the agreements governing each integration.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="commercial-outcomes"
        >
          <h2 id="commercial-outcomes">
            Support cross-network commercial opportunities
          </h2>

          <p>
            When participating parties can interpret inventory information
            consistently, they have a better foundation for identifying
            potential cross-network opportunities, coordinating commercial
            discussions and improving reporting consistency.
          </p>

          <p>
            Adlas is intended to support that information exchange; it does
            not replace media owners, concessionaires, agencies or existing
            commercial agreements.
          </p>
        </section>

        <section
          className={styles.contactSection}
          aria-labelledby="contact"
        >
          <h2 id="contact">Discuss your integration requirements</h2>

          <p>
            If you represent a transport operator, OOH media partner or
            integration team, contact Adlas to discuss your existing systems,
            inventory data and interoperability requirements.
          </p>

          <a
            className={styles.contactButton}
            href="/contact"
            aria-label="Email Adlas to discuss transport media data integration"
          >
            Discuss data integration
          </a>
        </section>
      </article>
    </main>
  );
}

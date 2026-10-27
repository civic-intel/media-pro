import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import styles from "./page.module.css";

const articlePath = "/insights/commercial-value-of-connected-data/";

export const metadata = buildPageMetadata({
  title: "The Commercial Value of Connected Data",
  description:
    "Explore how organisations commercialise data through licensing, analytics and services, and how interoperability could unlock more value from transport media information.",
  path: articlePath,
});

export default function CommercialValueOfConnectedDataPage() {
  return (
    <main className={styles.page}>
      <article className={styles.article} aria-labelledby="page-title">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/insights/" },
            { label: "The Commercial Value of Connected Data" },
          ]}
        />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>ADLAS / INSIGHTS</p>
          <h1 id="page-title">The Commercial Value of Connected Data</h1>
          <p className={styles.intro}>
            Data can be more than an operational by-product. When it is
            structured, maintained and made available under clear terms, it can
            become a valuable commercial asset.
          </p>
          <p className={styles.standfirst}>
            The opportunity is not simply to collect more data. It is to make
            information easier to understand, combine and use responsibly.
          </p>
        </header>

        <div className={styles.articleBody}>
          <section aria-labelledby="data-as-an-asset">
            <h2 id="data-as-an-asset">Data as a commercial asset</h2>
            <p>
              Organisations hold information that other organisations may need:
              addresses, geographic features, business records, market signals,
              audience insights and operational information. Commercial value
              can arise when that information is reliable, relevant and supplied
              in a form that customers can use.
            </p>
            <p>
              There is no single model for doing this. Some organisations
              license datasets directly. Others combine data with analysis,
              software or specialist services. The commercial model depends on
              the information, its permitted uses, the quality of the service
              and the needs of its customers.
            </p>
          </section>

          <section aria-labelledby="established-models">
            <h2 id="established-models">Established models for data value</h2>

            <div className={styles.example}>
              <p className={styles.exampleLabel}>ADDRESS DATA</p>
              <h3>Royal Mail: address data through licensing</h3>
              <p>
                Royal Mail’s Postcode Address File (PAF) provides a reference
                dataset of UK addresses. Organisations can obtain access under
                applicable licensing arrangements to support address matching,
                validation and related business processes. Used in e-commerce
                checkouts, logistics and delivery, CRM & database management,
                and fraud prevention & compliance.
              </p>
              <a
                className={styles.sourceLink}
                href="https://www.poweredbypaf.com/"
                target="_blank"
                rel="noreferrer"
              >
                Explore Royal Mail PAF licensing
                <span aria-hidden="true"> ↗</span>
              </a>
            </div>

            <div className={styles.example}>
              <p className={styles.exampleLabel}>DATA AND ANALYTICS</p>
              <h3>Experian: information combined with services</h3>
              <p>
                Experian illustrates a different model: data and analytical
                capabilities are used to provide services that help
                organisations assess customers, understand risk and make
                decisions. Value comes from more than the existence of a
                dataset; it also comes from how information is processed and
                applied. Used in financial services & lending, fraud prevention
                & identity verification, and background checks.
              </p>
              <a
                className={styles.sourceLink}
                href="https://www.experian.co.uk/business/"
                target="_blank"
                rel="noreferrer"
              >
                Explore Experian business services
                <span aria-hidden="true"> ↗</span>
              </a>
            </div>

            <div className={styles.example}>
              <p className={styles.exampleLabel}>GEOSPATIAL DATA</p>
              <h3>Ordnance Survey: geographic information</h3>
              <p>
                Ordnance Survey supplies mapping and location data for use in
                business and public-sector applications. Its data offerings
                demonstrate how consistent geographic reference information can
                support other products, services and decisions. Used for urban
                planning, property & construction, emergency services & public
                safety, navigation & logistics, environmental & land management,
                and outdoor recreation & tourism.
              </p>
              <a
                className={styles.sourceLink}
                href="https://www.ordnancesurvey.co.uk/"
                target="_blank"
                rel="noreferrer"
              >
                Explore Ordnance Survey data
                <span aria-hidden="true"> ↗</span>
              </a>
            </div>

            <p className={styles.caveat}>
              These examples illustrate different commercial approaches. They do
              not imply that all data is available for resale or unrestricted
              reuse; access and permitted use depend on the relevant terms and
              applicable law.
            </p>
          </section>

          <section aria-labelledby="fragmented-information">
            <h2 id="fragmented-information">
              The challenge: valuable information in separate systems
            </h2>
            <p>
              A dataset may be useful on its own, but its value can be limited
              when it cannot be reliably related to information held elsewhere.
              Different identifiers, field definitions, formats and update
              cycles can make otherwise compatible information difficult to
              combine.
            </p>
            <p>
              Interoperability addresses that problem. It helps systems exchange
              and interpret information consistently while allowing the
              organisations involved to retain their own operating environments
              and agreed responsibilities.
            </p>
            <div className={styles.principle}>
              <span className={styles.principleMark} aria-hidden="true">
                +
              </span>
              <p>
                <strong>Connected information creates options.</strong>
                <span>
                  Consistent data can make new analysis, services and commercial
                  relationships possible—but the outcome depends on data
                  quality, permissions and real customer demand.
                </span>
              </p>
            </div>
          </section>

          <section aria-labelledby="transport-media">
            <h2 id="transport-media">
              What this could mean for transport media
            </h2>
            <p>
              Transport operators and their out-of-home (OOH) media partners may
              each hold information relevant to commercial media opportunities.
              That can include asset identifiers, locations, formats,
              availability, audience measures and campaign reporting. The
              information may be managed across different organisations and
              technical systems.
            </p>
            <p>
              Consider an illustrative scenario: an operator maintains records
              about media locations, a media partner manages sales inventory,
              and a measurement provider supplies audience estimates. If the
              relevant information can be matched consistently and exchanged
              with appropriate permission, the parties may be better placed to
              assess inventory, coordinate opportunities and compare reporting.
            </p>
            <p>
              This is a conceptual example, not a claim about a live Adlas
              integration or a guaranteed commercial result. The feasibility
              depends on the data available, its quality, the parties’ rights
              and their commercial agreements.
            </p>
          </section>

          <section aria-labelledby="role-of-interoperability">
            <h2 id="role-of-interoperability">
              The role of an interoperability layer
            </h2>
            <p>
              Adlas is being developed around the information-exchange
              relationship between transport operators and their OOH media
              partners. The aim is to make relevant commercial media information
              easier to align and connect across existing systems, rather than
              requiring every organisation to replace its established
              technology.
            </p>
            <p>
              That focus raises practical questions: how are media assets
              identified across systems? Which attributes need a shared
              definition? Who is authorised to access each data field? How can
              changes and source information be understood by the parties using
              them?
            </p>
            <p>
              Addressing these questions can provide a foundation for more
              consistent information exchange. It does not remove the need for
              data ownership checks, licensing terms, privacy safeguards or
              clear agreements between participating organisations.
            </p>
            <Link
              className={styles.textLink}
              href="/solutions/transport-media-inventory-data-integration/"
            >
              Explore transport media data integration
            </Link>
          </section>

          <section aria-labelledby="beyond-transport">
            <h2 id="beyond-transport">
              A wider opportunity across data-rich industries
            </h2>
            <p>
              Similar challenges can arise wherever multiple organisations hold
              complementary information but use different systems, identifiers
              or commercial arrangements. Examples worth exploring include:
            </p>
            <ul>
              <li>
                <strong>Transport and mobility:</strong> operators, service
                providers and mobility platforms.
              </li>
              <li>
                <strong>Property:</strong> owners, agents, location-data
                providers and property-service businesses.
              </li>
              <li>
                <strong>Retail and advertising:</strong> retailers, media
                owners, agencies and measurement providers.
              </li>
              <li>
                <strong>Supply chains:</strong> manufacturers, distributors,
                logistics providers and buyers.
              </li>
            </ul>
            <p>
              Each sector has different legal, technical and commercial
              constraints. The common question is whether consistent, permitted
              information exchange can solve a real problem for the
              organisations involved.
            </p>
          </section>

          <section className={styles.closing} aria-labelledby="closing-title">
            <p className={styles.eyebrow}>THE ADLAS PERSPECTIVE</p>
            <h2 id="closing-title">
              Make commercial media information work together
            </h2>
            <p>
              For transport operators and OOH media partners, the opportunity
              starts with understanding the information already held across
              their commercial media estates—and where better interoperability
              could help.
            </p>
            <Link className={styles.cta} href="/contact/">
              Discuss your data-integration requirements
              <span aria-hidden="true"> ↗</span>
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}

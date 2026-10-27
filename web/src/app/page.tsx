import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import MobileNavigation from "@/components/mobile navigation/MobileNavigation";
import CustomCard from "@/components/cards/CustomCard";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  Landmark,
  Signpost,
  Monitor,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Layers3,
  ClipboardCheck,
  TrainFront,
  BusFront,
  Smartphone,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

const capabilities = [
  {
    number: "01",
    title: "Commercial asset data",
    description:
      "Create a more consistent view of transport advertising estates, media assets and inventory information across existing systems.",
  },
  {
    number: "02",
    title: "Scalable & reusable integrations",
    description:
      "Connect transport operators and existing OOH media partners through repeatable data integrations and a shared canonical model.",
  },
  {
    number: "03",
    title: "Governed data exchange",
    description:
      "Support permission-controlled access, traceable data provenance and auditable exchange between authorised parties.",
  },
];

type AssetCategory = {
  name: string;
  icons: LucideIcon[];
  description: string;
};

const assetCategories: AssetCategory[] = [
  {
    name: "Train stations",
    icons: [Landmark],
    description: "Station environments",
  },
  {
    name: "Trains / Rail",
    icons: [TrainFront],
    description: "On-board advertising",
  },
  {
    name: "Buses",
    icons: [BusFront],
    description: "Vehicle advertising",
  },
  {
    name: "Bus shelters",
    icons: [Signpost],
    description: "Street-level media",
  },
  {
    name: "Web & Mobile",
    icons: [Monitor, Smartphone],
    description: "Digital placements",
  },
  {
    name: "Publications",
    icons: [Newspaper],
    description: "Print advertising",
  },
];

export const metadata = buildPageMetadata({
  title: "Adlas | Transport Media Interoperability",
  description:
    "Adlas connects the commercial media operations of UK transport operators and out-of-home media partners through reusable integrations, structured inventory data and cross-network commercial opportunities.",
  path: "/",
  image: "/images/adlas-logo.png",
});

function Wordmark() {
  return (
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
  );
}

function RelationshipDiagram() {
  return (
    <section
      className={styles.graphPanel}
      aria-label="Illustrative transport advertising ecosystem"
    >
      <div className={styles.graphTopline}>
        <span>CURRENT MODEL</span>
        <span className={styles.liveLabel}>
          <span />
          ILLUSTRATION
        </span>
      </div>

      <div className={styles.relationshipLayout}>
        <aside
          className={`${styles.supportingNode} ${styles.nodeAgency}`}
          aria-label="Media agencies"
        >
          <span className={styles.nodeIcon} aria-hidden="true">
            <ChartNoAxesCombined size={24} />
          </span>
          <span className={styles.nodeLabel}>CAMPAIGN PLANNING</span>
          <span className={styles.nodeName}>Media agencies</span>
          <span className={styles.nodeDescription}>
            Plan campaigns and buy media on behalf of transport operators.
          </span>
        </aside>

        <div className={styles.ecosystemBoundary}>
          <div className={styles.boundaryHeading}>
            <span>CORE ECOSYSTEM</span>
            <span>OPERATORS · MEDIA PARTNERS · MEDIA INVENTORY</span>
          </div>

          <div className={`${styles.coreNode} ${styles.nodeOperator}`}>
            <span className={styles.nodeIcon} aria-hidden="true">
              <TrainFront size={24} />
            </span>
            <span className={styles.nodeLabel}>01 / ESTATE &amp; RIGHTS</span>
            <span className={styles.nodeName}>Transport operators</span>
            <span className={styles.nodeDescription}>
              Own transport estates, commercial rights and advertising
              opportunities.
            </span>
          </div>

          <div className={styles.relationshipConnector}>
            <span>COMMERCIAL RELATIONSHIPS</span>
          </div>

          <div className={`${styles.coreNode} ${styles.nodePartner}`}>
            <span className={styles.nodeIcon} aria-hidden="true">
              <BriefcaseBusiness size={24} />
            </span>
            <span className={styles.nodeLabel}>02 / MEDIA REPRESENTATION</span>
            <span className={styles.nodeName}>Media partners</span>
            <span className={styles.nodeDescription}>
              Represent commercial media estates, manage inventory, sales and
              campaign delivery.
            </span>
          </div>

          <div className={styles.relationshipConnector}>
            <span>INVENTORY DATA · AVAILABILITY &amp; ATTRIBUTES</span>
          </div>

          <div className={`${styles.coreNode} ${styles.nodeAssets}`}>
            <span className={styles.nodeIcon} aria-hidden="true">
              <Layers3 size={24} />
            </span>
            <span className={styles.nodeLabel}>03 / COMMERCIAL ASSETS</span>
            <span className={styles.nodeName}>Advertising inventory</span>
            <span className={styles.nodeDescription}>
              Physical and digital environments represented through structured
              asset information.
            </span>

            <div className={styles.assetCategoriesList}>
              {assetCategories.map(({ name, icons, description }) => (
                <div className={styles.assetCategory} key={name}>
                  <span
                    className={styles.assetCategoryIcons}
                    aria-hidden="true"
                  >
                    {icons.map((Icon, index) => (
                      <Icon key={`${name}-${index}`} size={20} />
                    ))}
                  </span>

                  <span>{name}</span>
                  <span className={styles.assetCategoryDescription}>
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside
          className={`${styles.supportingNode} ${styles.nodeAuditor}`}
          aria-label="Media auditors"
        >
          <span className={styles.nodeIcon} aria-hidden="true">
            <ClipboardCheck size={24} />
          </span>
          <span className={styles.nodeLabel}>INDEPENDENT OVERSIGHT</span>
          <span className={styles.nodeName}>Media auditors</span>
          <span className={styles.nodeDescription}>
            Review campaign delivery, evidence and contractual reporting on
            behalf of operators.
          </span>
        </aside>
      </div>

      <div className={styles.graphFooter}>
        <span>
          <i className={styles.legendLine} />
          Core commercial relationship
        </span>
        <span>
          <i className={`${styles.legendLine} ${styles.legendRelationship}`} />
          Supporting relationship
        </span>
        <span className={styles.graphFooterNote}>
          Illustrative only · Not live data
        </span>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className={styles.hero} id="platform">
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}>
          <span className={styles.statusDot} />
          TRANSPORT MEDIA INTEROPERABILITY
        </div>

        <h1>
          Connect the data
          <br />
          <span>behind transport media.</span>
        </h1>

        <p className={styles.heroText}>
          Adlas helps UK-based transport operators optimise their Out-of-Home
          (OOH) media partner integrations. Our platform facilitates increased
          commercial media revenues, unlocks network effects that minimise
          operational overheads, and enables frictionless data aggregation with
          measurable performance improvements—all without replacing existing
          platforms or contractual arrangements.
        </p>

        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="/contact">
            Discuss an integration <span aria-hidden="true">↗</span>
          </Link>
          <Link className={styles.secondaryButton} href="#capabilities">
            Discover the platform <span aria-hidden="true">↓</span>
          </Link>
        </div>

        <div className={styles.heroFootnote}>
          <span className={styles.footnoteLine} />
          CONNECTED SYSTEMS. CONSISTENT MEDIA DATA.
        </div>
      </div>

      <div className={styles.heroVisual}>
        <Image
          src="/hero.png"
          alt="A British urban transport scene featuring a bus shelter, a bus and a passing train."
          width={1672}
          height={940}
          priority
          sizes="(max-width: 950px) calc(100vw - 36px), 48vw"
        />
      </div>
    </section>
  );
}

function RelationshipSection() {
  return (
    <section
      className={styles.relationshipSection}
      aria-labelledby="ecosystem-heading"
    >
      <div className={styles.relationshipIntro}>
        <div>
          <div className={styles.eyebrow}>
            THE TRANSPORT OPERATOR OUT OF HOME MEDIA ECOSYSTEM
          </div>
          <h2 id="ecosystem-heading">Overview</h2>
        </div>

        <p>
          This is the current Out-Of-Home advertising eco-system of most
          transport operators in the United Kingdom.
        </p>
      </div>

      <RelationshipDiagram />
    </section>
  );
}

function CoverageBar() {
  return (
    <section className={styles.signalBar} aria-label="Adlas coverage">
      <span>ONE GOVERNED DATA EXCHANGE</span>
      <div className={styles.signalItems}>
        <span>Operators</span>
        <i />
        <span>Media partners</span>
        <i />
        <span>Commercial Asset Data</span>
        <i />
        <span>Inventory</span>
        <i />
        <span>Governance</span>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className={styles.capabilities} id="capabilities">
      <div className={styles.sectionIntro}>
        <div>
          <div className={styles.eyebrow}>
            BUILT FOR EXISTING COMMERCIAL TRANSPORT MEDIA ASSETS
          </div>
          <h2>
            From Fragmented Data
            <br />
            to Interoperable Systems.
          </h2>
        </div>

        <p>
          Standardise commercial media estate and inventory data across existing
          systems. As more operators and media partners connect, reusable
          integrations can reduce connection overhead and create more
          opportunities to package eligible inventory across networks.
        </p>
      </div>

      <div className={styles.capabilityGrid}>
        {capabilities.map((capability) => (
          <CustomCard
            key={capability.number}
            className={styles.capabilityCard}
            eyebrow={`PLATFORM CONCEPT · ${capability.number}`}
            title={capability.title}
            description={capability.description}
          />
        ))}
      </div>

      <p>
        Explore our approach to{" "}
        <Link
          href="/solutions/transport-media-inventory-data-integration"
          className={styles.textLink}
        >
          transport media data integration
        </Link>{" "}
        and governed information exchange.
      </p>
    </section>
  );
}

function ApproachSection() {
  return (
    <section className={styles.approach} id="approach">
      <div className={styles.approachIndex}>
        DATA INTEROPERABILITY <span>— 01</span>
      </div>

      <div>
        <h2>Integration without replacing existing systems.</h2>
        <p>
          Transport operators and media partners already work across different
          markets and established systems. Adlas is being developed to help them
          exchange consistent information through reusable integrations. By
          reducing repeated integration work and making compatible inventory
          easier to coordinate, the network can support lower operating
          overheads and broader commercial opportunities as participation grows.
        </p>
      </div>

      <div
        className={styles.approachStamp}
        aria-label="Designed for existing systems"
      >
        <span className={styles.approachStampLabel}>DESIGNED FOR</span>
        <strong className={styles.approachStampTitle}>
          Interoperability<span aria-hidden="true">.</span>
        </strong>
        <span className={styles.approachStampLabel}>BUILT FOR</span>
        <strong className={styles.approachStampTitle}>Existing Systems</strong>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className={styles.site}>
      <HeroSection />
      <RelationshipSection />
      <CoverageBar />
      <CapabilitiesSection />

      <section
        className={styles.insightCallout}
        aria-labelledby="featured-insight-title"
      >
        <div className={styles.insightCalloutCopy}>
          <span className={styles.insightEyebrow}>FEATURED INSIGHT</span>
          <h2 id="featured-insight-title">
            The Commercial Value of Connected Data
          </h2>
          <p>
            Explore how organisations commercialise data through licensing and
            analytics.
          </p>
        </div>

        <Link
          className={styles.insightLink}
          href="/insights/commercial-value-of-connected-data/"
        >
          Read the article <span aria-hidden="true">→</span>
        </Link>
      </section>

      <ApproachSection />
    </main>
  );
}

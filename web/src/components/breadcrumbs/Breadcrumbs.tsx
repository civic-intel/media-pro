import styles from "./Breadcrumbs.module.css";
import { serializeJsonLd } from "@/lib/seo/jsonld";
import { buildBreadcrumbSchema } from "@/lib/seo/schemas/breadcrumbs";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  structuredData?: boolean;
  className?: string;
};

export default function Breadcrumbs({
  items,
  structuredData = true,
  className,
}: BreadcrumbsProps) {
  const breadcrumbItems = items.map((item, index) => ({
    ...item,
    position: index + 1,
  }));

  const jsonLd = buildBreadcrumbSchema(items);

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={[styles.breadcrumbs, className].filter(Boolean).join(" ")}
      >
        <ol className={styles.list}>
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li
                className={styles.item}
                key={`${item.position}-${item.label}`}
              >
                {index > 0 && (
                  <span className={styles.separator} aria-hidden="true">
                    /
                  </span>
                )}
                {isCurrent || !item.href ? (
                  <span
                    className={isCurrent ? styles.current : undefined}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <a className={styles.link} href={item.href}>
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(jsonLd),
          }}
        />
      )}
    </>
  );
}

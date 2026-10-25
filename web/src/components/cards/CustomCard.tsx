import type { ReactNode } from "react";
import styles from "./CustomCard.module.css";

export type CustomCardLink = {
  label: string;
  href: string;
};

export type CustomCardProps = {
  eyebrow?: string;
  title: ReactNode;
  image?: ReactNode;
  description?: ReactNode;
  details?: ReactNode;
  links?: CustomCardLink[];
  action?: ReactNode;
  className?: string;
};

export default function CustomCard({
  eyebrow,
  title,
  image,
  description,
  details,
  links = [],
  action,
  className,
}: CustomCardProps) {
  return (
    <article
      className={[styles.customCard, className].filter(Boolean).join(" ")}
    >
      <div className={styles.customCardHeader}>
        {eyebrow != null && (
          <p className={styles.customCardEyebrow}>{eyebrow}</p>
        )}

        {image != null && <div className={styles.customCardImage}>{image}</div>}

        <div className={styles.customCardTitle}>{title}</div>
      </div>

      <div className={styles.customCardBody}>
        {description != null && (
          <div className={styles.customCardDescription}>{description}</div>
        )}

        {details != null && (
          <div className={styles.customCardDetails}>{details}</div>
        )}
      </div>

      {(links.length > 0 || action != null) && (
        <div className={styles.customCardFooter}>
          {links.length > 0 && (
            <nav
              className={styles.customCardLinks}
              aria-label="External sources"
            >
              {links.map((link) => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <span aria-hidden="true"> ↗</span>
                </a>
              ))}
            </nav>
          )}

          {action != null && (
            <div className={styles.customCardAction}>{action}</div>
          )}
        </div>
      )}
    </article>
  );
}

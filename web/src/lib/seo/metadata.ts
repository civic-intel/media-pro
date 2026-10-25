import type { Metadata } from "next";
import { getCanonicalUrl } from "./canonical";
import { DEFAULT_LOCALE, SITE_DESCRIPTION, SITE_NAME } from "./site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  index?: boolean;
};

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  image,
  index = true,
}: PageMetadataOptions): Metadata {
  const canonical = getCanonicalUrl(path);
  const openGraphImage = image
    ? image.startsWith("http")
      ? image
      : `${getCanonicalUrl("/").replace(/\/$/, "")}${image.startsWith("/") ? image : `/${image}`}`
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index,
      follow: index,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: DEFAULT_LOCALE,
      ...(openGraphImage ? { images: [{ url: openGraphImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(openGraphImage ? { images: [openGraphImage] } : {}),
    },
  };
}

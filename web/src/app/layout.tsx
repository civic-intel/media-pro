import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_LOCALE,
} from "@/lib/seo/site";
import SiteHeader from "@/components/site-header/SiteHeader";
import SiteFooter from "@/components/site-footer/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | Transport Media Advertising Interoperability`,
    template: `%s | ${SITE_NAME}`,
  },
    icons: {
    icon: "/icon.svg",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Transport Media Advertising Interoperability`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    locale: DEFAULT_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Transport Media Advertising Interoperability`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
      <body>
        <SiteHeader />
          {children}
        <SiteFooter />
      </body>
    </html>
  );
}

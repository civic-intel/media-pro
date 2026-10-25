const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://adlas.pro";

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

export const SITE_NAME = "Adlas";

export const SITE_DESCRIPTION =
  "Adlas is a transport media advertising interoperability platform helping UK transport operators and their OOH media partners reuse integrations, optimise commercial media estates and inventory data, create cross-network premium advertising opportunities, reduce operational overheads through network effects and measure performance.";

export const DEFAULT_LOCALE = "en_GB";

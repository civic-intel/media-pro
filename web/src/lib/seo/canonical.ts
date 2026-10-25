import { SITE_URL } from "./site";

/**
 * Build a canonical URL for a public page.
 * Accepts paths such as "/", "/solutions/" or "/insights/example/".
 */
export function getCanonicalUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutTrailingSlashes =
    normalizedPath === "/" ? "/" : normalizedPath.replace(/\/+$/, "");

  return pathWithoutTrailingSlashes === "/"
    ? `${SITE_URL}/`
    : `${SITE_URL}${pathWithoutTrailingSlashes}/`;
}

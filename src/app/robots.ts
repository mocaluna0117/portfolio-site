import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Everything may be crawled. The sign-in page and the admin screens are not
 * listed here (that would only advertise them); they carry noindex instead.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

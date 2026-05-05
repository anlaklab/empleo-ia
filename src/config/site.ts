/**
 * Single source of truth for site-wide IDs, tokens and external endpoints.
 * Edit values here; Base.astro reads them and renders the corresponding tags.
 * Empty strings render nothing (clean HTML), so it is safe to leave a field
 * blank until the token is available.
 */

export const SITE = {
  url: "https://empleo-ai.anlakstudio.com",

  // Search engine ownership verification (paste only the `content` value).
  // Get from: Search Console → property → HTML tag verification.
  googleSiteVerification: "y1Big3z8JiQc5rclYtbH-eoUijXAJg6yFTebaxsv39A",
  // Get from: Bing Webmaster Tools → site → Meta tag authentication.
  bingSiteVerification: "",

  // Umami self-hosted analytics
  umamiWebsiteId: "002f081c-5097-4b0c-970b-602f8e90b3e1",
  umamiSrc: "https://umami.anlakstudio.com/script.js",
} as const;

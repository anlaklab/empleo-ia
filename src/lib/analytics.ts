/**
 * Umami analytics event tracking.
 * All events use umami.track(event, data).
 * Safe to call even if Umami hasn't loaded yet.
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void;
    };
  }
}

function track(event: string, data?: Record<string, string | number>) {
  try {
    window.umami?.track(event, data);
  } catch {
    // silently ignore if umami not available
  }
}

// — Navigation & Views —
export const trackViewChange = (view: string) =>
  track("view-change", { view });

export const trackLanguageChange = (lang: string) =>
  track("language-change", { lang });

// — Filters —
export const trackSectorFilter = (sector: string) =>
  track("sector-filter", { sector });

export const trackSearch = (query: string) =>
  track("search", { query: query.slice(0, 50) });

export const trackSort = (sortBy: string) =>
  track("sort-change", { sort_by: sortBy });

export const trackScoreRange = (min: number, max: number) =>
  track("score-range", { min, max });

// — Occupation interactions —
export const trackOccupationSelect = (cno: string, name: string, source: string) =>
  track("occupation-select", { cno, name: name.slice(0, 60), source });

export const trackOccupationClose = () =>
  track("occupation-close");

export const trackSectorGroupClick = (sector: string) =>
  track("sector-group-click", { sector });

// — Share —
export const trackShare = (channel: string, cno: string) =>
  track("share", { channel, cno });

export const trackShareUrl = (url: string) =>
  track("share-url", { url: url.slice(0, 100) });

// — Methodology & info —
export const trackMethodologyOpen = () =>
  track("methodology-open");

export const trackMethodologyLink = (target: string) =>
  track("methodology-link", { target });

export const trackHowToReadToggle = (open: boolean) =>
  track("how-to-read", { action: open ? "open" : "close" });

// — Histogram —
export const trackHistogramView = () =>
  track("histogram-view");

"use client";
import ScrapeNowButton from "./ScrapeNowButton";
import LastScrapedTimestamp from "./LastScrapedTimestamp";

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional ISO timestamp for the last scrape, if the tab already loaded it. */
  scrapedAt?: string | null;
  /** Called after a Scrape now completes, so the parent can refetch. */
  onScrapeComplete?: () => void;
  /** Hide the scrape controls (e.g. on Settings). */
  hideScrape?: boolean;
}

/**
 * Standard tab top bar.
 * Left: title + optional subtitle.
 * Right: Scrape now button + Last scraped caption.
 *
 * Every tab uses this so the user can refresh data from anywhere.
 */
export default function TabHeader({
  title,
  subtitle,
  scrapedAt,
  onScrapeComplete,
  hideScrape = false,
}: TabHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-header)",
            fontSize: "2rem",
            margin: 0,
            marginBottom: subtitle ? "0.35rem" : 0,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: "var(--color-text-dim)",
              fontSize: "0.875rem",
              margin: 0,
              maxWidth: "640px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {!hideScrape && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          <ScrapeNowButton onComplete={onScrapeComplete} />
          <LastScrapedTimestamp scrapedAt={scrapedAt} />
        </div>
      )}
    </div>
  );
}

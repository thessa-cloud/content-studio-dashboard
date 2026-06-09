"use client";
import { useEffect, useState } from "react";

interface LastScrapedTimestampProps {
  /** ISO timestamp string, or null when no scrape has happened yet. */
  scrapedAt?: string | null;
}

function relative(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "unknown";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Read-only "Last scraped X ago" caption. Sits next to every Scrape now button.
 * Self-fetches if no scrapedAt prop is supplied, otherwise renders the prop.
 */
export default function LastScrapedTimestamp({ scrapedAt }: LastScrapedTimestampProps) {
  const [ts, setTs] = useState<string | null>(scrapedAt ?? null);

  useEffect(() => {
    if (scrapedAt !== undefined) {
      setTs(scrapedAt);
      return;
    }
    fetch("/api/data?tab=scrape-meta")
      .then((r) => r.json())
      .then((r) => setTs(r?.data?.scraped_at ?? null))
      .catch(() => setTs(null));
  }, [scrapedAt]);

  return (
    <span
      style={{
        fontSize: "0.72rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.02em",
      }}
    >
      {ts ? `Last scraped ${relative(ts)}` : "No scrape yet"}
    </span>
  );
}

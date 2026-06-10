"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import config from "../../../config.json";
import TabContainer from "../shared/TabContainer";
import TabHeader from "../shared/TabHeader";
import EmptyState from "../shared/EmptyState";

type TopPost = {
  id: string;
  caption_preview: string;
  hook: string;
  hook_type?: string;
  pillar?: string;
  type: "carousel" | "reel" | "image" | "story";
  likes: number;
  comments: number;
  views?: number;
  url?: string;
  posted_at?: string;
};

type Breakdown = { label: string; share: number }; // share 0..1

type PerformanceData = {
  followers: number | null;
  avg_likes: number | null;
  best_pillar: string | null;
  best_hook_type: string | null;
  top_posts: TopPost[];
  pillar_breakdown: Breakdown[];
  hook_breakdown: Breakdown[];
  scraped_at?: string | null;
};

/**
 * Performance tab.
 *
 * What lives here:
 *  - Headline stats (followers, average likes, best pillar, best hook)
 *  - Top performing posts (sorted by engagement)
 *  - Pillar and hook breakdown bars
 *
 * Populated by the analyse-winners Claude prompt after a scrape (the user
 * clicks the in-app button which copies a self-contained prompt + opens
 * claude.ai, then pastes the JSON reply back into a Paste field).
 */
export default function Performance() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/data?tab=performance")
      .then((r) => r.json())
      .then((r) => {
        setData(r.data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const hasPosts = (data?.top_posts ?? []).length > 0;

  const stats: Array<{ label: string; value: string; sub?: string }> = [
    {
      label: "Followers",
      value: data?.followers != null ? data.followers.toLocaleString() : "—",
      sub: config.instagramHandle ? `@${config.instagramHandle}` : undefined,
    },
    {
      label: "Avg likes",
      value: data?.avg_likes != null ? data.avg_likes.toLocaleString() : "—",
      sub: "last 30 posts",
    },
    {
      label: "Best pillar",
      value: data?.best_pillar ?? "—",
    },
    {
      label: "Best hook",
      value: data?.best_hook_type ?? "—",
    },
  ];

  return (
    <TabContainer>
      <TabHeader
        title="Performance"
        subtitle="What's actually working. Top posts, hooks, and pillars sorted by engagement."
        scrapedAt={data?.scraped_at}
        onScrapeComplete={load}
      />

      {loading && (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "100px" }} />
          ))}
        </div>
      )}

      {!loading && !hasPosts && (
        <EmptyState
          title="No performance data yet"
          body="After your first scrape, Claude surfaces your top posts, best hooks and strongest pillar here. Trigger a scrape with the button above, then run the analysis prompt on the Strategy tab."
        />
      )}

      {!loading && hasPosts && (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "1.1rem 1.25rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--color-text-dim)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                    fontWeight: 700,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-header)",
                    fontSize: "1.5rem",
                    color: s.value === "—" ? "var(--color-taupe)" : "var(--color-text)",
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </p>
                {s.sub && (
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginTop: "0.3rem" }}>{s.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* Top posts table */}
          <h2 style={{ fontFamily: "var(--font-header)", fontSize: "1.2rem", marginBottom: "0.85rem" }}>
            Top performing posts
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "2.25rem" }}>
            {data!.top_posts.slice(0, 10).map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "0.85rem 1.15rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                  <Pill>{p.type}</Pill>
                  {p.pillar && <Pill tone="cream">{p.pillar}</Pill>}
                  {p.hook_type && <Pill tone="cream">{p.hook_type}</Pill>}
                </div>
                <p style={{ fontSize: "0.88rem", marginBottom: "0.3rem", lineHeight: 1.45 }}>
                  {p.hook || p.caption_preview}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.74rem",
                    color: "var(--color-text-dim)",
                  }}
                >
                  <span>
                    {p.likes.toLocaleString()} likes
                    {p.views ? ` · ${p.views.toLocaleString()} views` : ""} · {p.comments} comments
                  </span>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--color-burgundy)", display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                    >
                      Open <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown bars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <BreakdownCard title="By pillar" rows={data!.pillar_breakdown} />
            <BreakdownCard title="By hook type" rows={data!.hook_breakdown} />
          </div>
        </>
      )}
    </TabContainer>
  );
}

function Pill({
  children,
  tone = "burgundy",
}: {
  children: React.ReactNode;
  tone?: "burgundy" | "cream";
}) {
  const styles =
    tone === "burgundy"
      ? { bg: "var(--color-burgundy-soft, #fdf0f0)", color: "var(--color-burgundy)" }
      : { bg: "var(--color-cream)", color: "var(--color-taupe)" };
  return (
    <span
      style={{
        background: styles.bg,
        color: styles.color,
        padding: "0.12rem 0.55rem",
        borderRadius: "20px",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </span>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Breakdown[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "1.1rem 1.25rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h3 style={{ fontFamily: "var(--font-header)", fontSize: "1rem", marginBottom: "0.8rem" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.2rem" }}>
              <span style={{ color: "var(--color-text)" }}>{r.label}</span>
              <span style={{ color: "var(--color-text-dim)" }}>{Math.round(r.share * 100)}%</span>
            </div>
            <div style={{ background: "var(--color-cream)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.round(r.share * 100)}%`,
                  background: "var(--color-burgundy)",
                  height: "100%",
                  transition: "width 320ms var(--ease-out)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

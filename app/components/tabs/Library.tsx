"use client";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import TabContainer from "../shared/TabContainer";
import TabHeader from "../shared/TabHeader";
import EmptyState from "../shared/EmptyState";

type LibraryPost = {
  id: string;
  source: "self" | "competitor";
  handle: string;
  type: "carousel" | "reel" | "image" | "story";
  caption: string;
  hook?: string;
  hook_type?: string;
  pillar?: string;
  likes: number;
  comments: number;
  views?: number;
  url?: string;
  posted_at?: string;
  scraped_at?: string;
};

type LibraryData = {
  posts: LibraryPost[];
  scraped_at?: string | null;
};

/**
 * Library tab.
 *
 * The raw scrape data, searchable + filterable. Source for everything Claude
 * Code reads when running any prompt. No Claude prompt needed to populate this;
 * a successful scrape fills it directly.
 */
export default function Library() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "self" | "competitor">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | LibraryPost["type"]>("all");

  const load = () => {
    setLoading(true);
    fetch("/api/data?tab=library")
      .then((r) => r.json())
      .then((r) => {
        setData(r.data ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const posts = data?.posts ?? [];
  const hasPosts = posts.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (sourceFilter !== "all" && p.source !== sourceFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (q) {
        const hay = `${p.caption} ${p.hook ?? ""} ${p.handle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, query, sourceFilter, typeFilter]);

  return (
    <TabContainer>
      <TabHeader
        title="Library"
        subtitle="The raw scrape. Every post Claude Code reads when running a prompt lives here, searchable and filterable."
        scrapedAt={data?.scraped_at}
        onScrapeComplete={load}
      />

      {loading && (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "88px" }} />
          ))}
        </div>
      )}

      {!loading && !hasPosts && (
        <EmptyState
          title="Library is empty"
          body="Trigger your first scrape with the Scrape now button above. Posts from your own handle and your competitors will land here, ready for Claude Code to read."
        />
      )}

      {!loading && hasPosts && (
        <>
          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.5rem 0.85rem",
                flex: "1 1 220px",
                minWidth: 0,
              }}
            >
              <Search size={14} strokeWidth={1.8} style={{ color: "var(--color-text-dim)", flexShrink: 0 }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search captions, hooks, handles"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-body)",
                  width: "100%",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <FilterGroup
              value={sourceFilter}
              onChange={(v) => setSourceFilter(v as typeof sourceFilter)}
              options={[
                { value: "all", label: "All" },
                { value: "self", label: "Mine" },
                { value: "competitor", label: "Competitors" },
              ]}
            />

            <FilterGroup
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as typeof typeFilter)}
              options={[
                { value: "all", label: "Any" },
                { value: "carousel", label: "Carousels" },
                { value: "reel", label: "Reels" },
                { value: "image", label: "Images" },
                { value: "story", label: "Stories" },
              ]}
            />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--color-text-dim)", marginBottom: "1rem" }}>
            {filtered.length} of {posts.length} posts
          </p>

          {filtered.length === 0 && (
            <div
              style={{
                background: "var(--color-cream)",
                border: "1px dashed var(--color-border)",
                borderRadius: "10px",
                padding: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--color-text-dim)",
                textAlign: "center",
              }}
            >
              No posts match these filters.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${p.source === "self" ? "var(--color-burgundy)" : "var(--color-taupe)"}`,
                  borderRadius: "10px",
                  padding: "0.85rem 1.15rem",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    marginBottom: "0.4rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: p.source === "self" ? "var(--color-burgundy)" : "var(--color-taupe)",
                    }}
                  >
                    @{p.handle}
                  </span>
                  <Tag>{p.type}</Tag>
                  {p.pillar && <Tag tone="dim">{p.pillar}</Tag>}
                  {p.hook_type && <Tag tone="dim">{p.hook_type}</Tag>}
                  {p.posted_at && (
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginLeft: "auto" }}>
                      {new Date(p.posted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.86rem", marginBottom: "0.3rem", lineHeight: 1.5 }}>
                  {p.hook || p.caption.slice(0, 180)}
                  {!p.hook && p.caption.length > 180 ? "..." : ""}
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
                      style={{
                        color: "var(--color-burgundy)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        textDecoration: "none",
                      }}
                    >
                      Open <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </TabContainer>
  );
}

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              background: active ? "var(--color-burgundy)" : "#fff",
              border: `1px solid ${active ? "var(--color-burgundy)" : "var(--color-border)"}`,
              color: active ? "#fff" : "var(--color-text-dim)",
              padding: "0.4rem 0.85rem",
              borderRadius: "20px",
              fontSize: "0.74rem",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "dim" }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        background: "var(--color-cream)",
        color: tone === "dim" ? "var(--color-text-dim)" : "var(--color-taupe)",
        padding: "0.1rem 0.5rem",
        borderRadius: "20px",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

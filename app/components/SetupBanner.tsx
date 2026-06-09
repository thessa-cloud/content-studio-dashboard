"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink, RefreshCw } from "lucide-react";

type SetupStatus = {
  ready: boolean;
  supabaseConfigured: boolean;
  missingTables: string[];
  sql: string;
  supabaseSqlEditorUrl: string | null;
  reason?: string;
};

// Raw Postgres table name → user-facing label. The DB still says `library_posts`
// for backwards-compat (renaming the table would break every existing install),
// but users see "Vault posts" so the Library→Vault rename feels complete.
const TABLE_DISPLAY_NAMES: Record<string, string> = {
  library_posts: "Vault posts",
  performance: "Performance",
  strategy: "Strategy",
  drafts: "Drafts",
  competitors: "Competitors",
  scrape_log: "Scrape log",
};
const displayTable = (raw: string) => TABLE_DISPLAY_NAMES[raw] ?? raw;

/**
 * SetupBanner.
 *
 * Renders at the top of every tab until /api/setup reports `ready: true`.
 * Two states:
 *
 *  - Supabase env vars missing → tell the user to paste them into Vercel.
 *  - Tables missing             → one click to open their Supabase SQL editor,
 *                                 one click to copy the migration SQL.
 *
 * Once `ready === true` the component renders nothing (no flash, no chrome).
 */
export default function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const probe = async () => {
    try {
      const r = await fetch("/api/setup", { cache: "no-store" });
      const j = (await r.json()) as SetupStatus;
      setStatus(j);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
      setRechecking(false);
    }
  };

  useEffect(() => {
    probe();
  }, []);

  const copySql = async () => {
    if (!status?.sql) return;
    try {
      await navigator.clipboard.writeText(status.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Older browsers, do nothing — the SQL is still visible in the textarea.
    }
  };

  const recheck = async () => {
    setRechecking(true);
    await probe();
  };

  // Hide everything while we don't know, and after we know it's ready.
  if (loading || !status || status.ready) return null;

  const envMissing = !status.supabaseConfigured;

  return (
    <div
      style={{
        margin: "1rem 1.25rem 0",
        background: "#fff8ec",
        border: "1px solid #f0d089",
        borderLeft: "3px solid #c98a16",
        borderRadius: "12px",
        padding: "1rem 1.15rem",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
        <AlertTriangle size={18} strokeWidth={1.8} style={{ color: "#a06700", flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-header)",
              fontSize: "1.05rem",
              color: "#5e3f00",
              letterSpacing: "-0.005em",
            }}
          >
            {envMissing ? "Connect Supabase to finish setup" : "Run the database setup"}
          </h3>
          <p
            style={{
              marginTop: "0.4rem",
              marginBottom: "0.85rem",
              fontSize: "0.85rem",
              lineHeight: 1.55,
              color: "#5e3f00",
            }}
          >
            {envMissing ? (
              <>
                {status.reason ??
                  "Paste NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY into your Vercel project settings, then redeploy."}
              </>
            ) : (
              <>
                Your Supabase project is connected, but the dashboard&apos;s tables don&apos;t exist yet.
                Click below to open your SQL editor, paste the migration, click Run. Sixty seconds.
                {status.missingTables.length > 0 && (
                  <>
                    {" "}
                    Missing:{" "}
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {status.missingTables.map(displayTable).join(", ")}
                    </span>
                    .
                  </>
                )}
              </>
            )}
          </p>

          {!envMissing && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem", alignItems: "center" }}>
              {status.supabaseSqlEditorUrl && (
                <a
                  href={status.supabaseSqlEditorUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    background: "var(--color-burgundy)",
                    color: "#fff",
                    padding: "0.55rem 0.95rem",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Open Supabase SQL editor <ExternalLink size={13} strokeWidth={2} />
                </a>
              )}
              <button
                type="button"
                onClick={copySql}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "#fff",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "0.55rem 0.95rem",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? (
                  <>
                    <Check size={13} strokeWidth={2.2} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2} /> Copy migration SQL
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={recheck}
                disabled={rechecking}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "transparent",
                  border: "1px dashed var(--color-border)",
                  color: "var(--color-text-dim)",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "10px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: rechecking ? "default" : "pointer",
                  opacity: rechecking ? 0.6 : 1,
                }}
              >
                <RefreshCw
                  size={12}
                  strokeWidth={2}
                  style={
                    rechecking
                      ? { animation: "setup-spin 700ms linear infinite" }
                      : undefined
                  }
                />
                {rechecking ? "Checking…" : "I ran it, re-check"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Keyframes are global so the inline animation: "setup-spin ..." resolves.
          Scoped under a unique name (`setup-spin`, not `spin`) to avoid collision. */}
      <style jsx global>{`
        @keyframes setup-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState } from "react";
import config from "../../../config.json";

/**
 * Settings tab, placeholder for v1 milestone.
 *
 * What this tab will own once finished:
 *  - Apify token input (stored in Vercel env, surfaced read-only here)
 *  - Brand name + accent color picker (writes to config.json via the
 *    `/api/config` route, hot-reloads the dashboard)
 *  - Instagram handle to scrape
 *  - Competitor handles list (max 5)
 *  - Trigger words list (used by Drafts tagger)
 *
 * For now: read-only display of the current config + an empty Apify token
 * field. Real wiring lands in a follow-up commit.
 */
export default function Settings() {
  const [apifyToken, setApifyToken] = useState("");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <h1 style={{
        fontFamily: "var(--font-header)",
        fontSize: "2rem",
        marginBottom: "0.5rem",
      }}>
        Settings
      </h1>
      <p style={{ color: "var(--color-text-dim)", marginBottom: "2rem" }}>
        Configure your brand, Instagram handle, and scrape source.
      </p>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Brand</h2>
        <Row label="Brand name" value={config.brandName} />
        <Row label="Instagram handle" value={`@${config.instagramHandle}`} />
        <Row label="Accent color" value={config.theme.accent}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              borderRadius: 4,
              background: config.theme.accent,
              border: "1px solid var(--color-border)",
              verticalAlign: "middle",
              marginLeft: 8,
            }}
          />
        </Row>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Apify scraper</h2>
        <p style={{ color: "var(--color-text-dim)", fontSize: 14, marginBottom: 16 }}>
          Paste your Apify API token below. Stored locally only.
          To use across deploys, also add APIFY_TOKEN to your Vercel env vars.
        </p>
        <input
          type="password"
          value={apifyToken}
          onChange={e => setApifyToken(e.target.value)}
          placeholder="apify_api_********"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
          }}
        />
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Competitors</h2>
        {config.competitors.length === 0 ? (
          <p style={{ color: "var(--color-text-dim)", fontSize: 14 }}>
            No competitor handles yet. Add up to 5 in config.json or via Claude Code.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {config.competitors.map((handle: string) => (
              <li key={handle} style={{ padding: "0.5rem 0" }}>@{handle}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Trigger words</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {config.triggerWords.map((word: string) => (
            <span key={word} style={pillStyle}>{word}</span>
          ))}
        </div>
      </section>

      <p style={{
        marginTop: "3rem",
        padding: "1rem",
        borderRadius: "var(--radius-sm)",
        background: "var(--color-cream)",
        color: "var(--color-text-dim)",
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        <strong>Tip:</strong> ask Claude Code to update any of these fields for you.
        Example: <em>&quot;Add @username to my competitors and refresh the Intel tab.&quot;</em>
      </p>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  paddingBottom: "1.5rem",
  borderBottom: "1px solid var(--color-border-light)",
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-header)",
  fontSize: "1.15rem",
  marginBottom: "1rem",
  color: "var(--color-text)",
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.4rem 0.85rem",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-burgundy-soft)",
  color: "var(--color-burgundy)",
  fontSize: "0.85rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
};

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.6rem 0",
      borderBottom: "1px dashed var(--color-border-light)",
    }}>
      <span style={{ color: "var(--color-text-dim)", fontSize: 14 }}>{label}</span>
      <span style={{ color: "var(--color-text)", fontSize: 14, fontWeight: 500 }}>
        {value}
        {children}
      </span>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Performance from "./components/tabs/Performance";
import Strategy from "./components/tabs/Strategy";
import Drafts from "./components/tabs/Drafts";
import Library from "./components/tabs/Library";
import Intel from "./components/tabs/Intel";
import Settings from "./components/tabs/Settings";
import config from "../config.json";

type Tab = "drafts" | "strategy" | "performance" | "intel" | "library" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  drafts:      "Drafts",
  strategy:    "Strategy",
  performance: "Performance",
  intel:       "Competitor Intel",
  library:     "Library",
  settings:    "Settings",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("drafts");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close drawer when tab changes (mobile UX)
  useEffect(() => {
    setMobileOpen(false);
  }, [tab]);

  const brandName = config.brandName || "Your Brand";

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--color-bg)",
    }}>
      <Sidebar
        active={tab}
        onSelect={setTab}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className="main-area">
        {/* Mobile top bar, hamburger + current tab label */}
        <header className="mobile-topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <span className="mobile-tab-label">{TAB_LABELS[tab]}</span>
          <span className="mobile-brand">{brandName}</span>
        </header>

        <div key={tab} className="fade-in">
          {tab === "drafts"      && <Drafts />}
          {tab === "strategy"    && <Strategy />}
          {tab === "performance" && <Performance />}
          {tab === "intel"       && <Intel />}
          {tab === "library"     && <Library />}
          {tab === "settings"    && <Settings />}
        </div>
      </main>

      <style jsx>{`
        .main-area {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
        }

        .mobile-topbar { display: none; }

        @media (max-width: 768px) {
          .mobile-topbar {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.85rem 1rem;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: saturate(140%) blur(8px);
            -webkit-backdrop-filter: saturate(140%) blur(8px);
            border-bottom: 1px solid var(--color-border-light);
            position: sticky;
            top: 0;
            z-index: 30;
          }
          .hamburger {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: #fff;
            color: var(--color-burgundy);
            cursor: pointer;
            transition: background 180ms ease, border-color 180ms ease, transform 120ms ease;
          }
          .hamburger:active { transform: scale(0.96); }
          .hamburger:hover,
          .hamburger:focus-visible {
            background: var(--color-cream);
            border-color: var(--color-burgundy);
          }
          .mobile-tab-label {
            font-family: var(--font-header);
            font-size: 1.05rem;
            color: var(--color-text);
            font-weight: 600;
            letter-spacing: -0.005em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
          }
          .mobile-brand {
            font-family: var(--font-header);
            font-size: 0.85rem;
            color: var(--color-burgundy);
            letter-spacing: 0.18em;
            font-weight: 700;
          }
        }
      `}</style>
    </div>
  );
}

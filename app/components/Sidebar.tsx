"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Sparkles,
  PenLine,
  Archive as VaultIcon,
  Search,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import config from "../../config.json";
import { fetchEffectiveSettings } from "../../lib/settings";

type Tab = "drafts" | "strategy" | "performance" | "intel" | "vault" | "settings";

interface SidebarProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
  isOpen: boolean;          // mobile drawer state
  onClose: () => void;      // close drawer (mobile)
}

const tabs: { id: Tab; Icon: typeof BarChart3; label: string }[] = [
  { id: "drafts",      Icon: PenLine,     label: "Drafts" },
  { id: "strategy",    Icon: Sparkles,    label: "Strategy" },
  { id: "performance", Icon: BarChart3,   label: "Performance" },
  { id: "intel",       Icon: Search,      label: "Competitor Intel" },
  { id: "vault",       Icon: VaultIcon,   label: "Vault" },
  { id: "settings",    Icon: SettingsIcon, label: "Settings" },
];

const TAB_HEIGHT = 42;
const TAB_GAP = 2;

export default function Sidebar({ active, onSelect, isOpen, onClose }: SidebarProps) {
  const activeIndex = tabs.findIndex(t => t.id === active);

  // Brand name comes from the EFFECTIVE settings (Supabase → localStorage →
  // config.json), not directly from the bundled config.json. Reading config
  // statically meant editing brand name in the Settings tab had no effect
  // here — Thessa: "Als ik een brand name invul veranderd er in de sidebar
  // niks". We seed with the static config value so the initial paint is not
  // blank, then refresh from the effective source on mount AND whenever
  // Settings emits a `cs-settings:saved` event after a successful save.
  const [brandName, setBrandName] = useState<string>(
    config.brandName || "Your Brand"
  );
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const s = await fetchEffectiveSettings();
        if (cancelled) return;
        // Empty brand_name from the effective layer means the customer
        // genuinely cleared it; fall back to the deploy default rather than
        // showing "" in the header.
        setBrandName(s.brand_name?.trim() || config.brandName || "Your Brand");
      } catch {
        // Network or parse error — keep whatever brand name we already had.
      }
    }
    refresh();
    // Settings.tsx dispatches this event after a successful save (Supabase
    // or localStorage), so the sidebar picks up the new value without a
    // page reload.
    const onSettingsSaved = () => refresh();
    window.addEventListener("cs-settings:saved", onSettingsSaved);
    // If a second tab edited settings (localStorage path), the `storage`
    // event fires here. Same handler — refetch and re-render.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cs-settings") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("cs-settings:saved", onSettingsSaved);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Body scroll lock + Escape handler when mobile drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop scrim, mobile only, fades in/out */}
      <div
        className={`sidebar-backdrop${isOpen ? " is-open" : ""}`}
        aria-hidden
        onClick={onClose}
      />

      <aside
        className={`sidebar${isOpen ? " is-open" : ""}`}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Brand block */}
        <div style={{
          padding: "2rem 1.75rem 1.5rem",
          borderBottom: "1px solid var(--color-border-light)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-header)",
              fontSize: "1.4rem",
              color: "var(--color-burgundy)",
              letterSpacing: "0.04em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              {brandName}
            </h1>
            <p style={{
              fontSize: "0.65rem",
              color: "var(--color-taupe)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginTop: "0.5rem",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
            }}>
              Content Studio
            </p>
          </div>
          {/* Mobile-only close button */}
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Nav with sliding active indicator */}
        <nav style={{
          flex: 1,
          padding: "1.25rem 0.5rem",
          position: "relative",
        }}>
          {/* Sliding indicator (background pill) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "0.5rem",
              right: "0.5rem",
              top: `calc(1.25rem + ${activeIndex * (TAB_HEIGHT + TAB_GAP)}px)`,
              height: `${TAB_HEIGHT}px`,
              background: "var(--color-cream)",
              borderRadius: "10px",
              transition: "top 320ms var(--ease-out)",
              pointerEvents: "none",
            }}
          />
          {/* Sliding active accent (left bar) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: `calc(1.25rem + ${activeIndex * (TAB_HEIGHT + TAB_GAP)}px + 8px)`,
              width: "3px",
              height: `${TAB_HEIGHT - 16}px`,
              background: "var(--color-burgundy)",
              borderTopRightRadius: "2px",
              borderBottomRightRadius: "2px",
              transition: "top 320ms var(--ease-out)",
              pointerEvents: "none",
            }}
          />

          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  height: `${TAB_HEIGHT}px`,
                  marginBottom: `${TAB_GAP}px`,
                  padding: "0 1.25rem",
                  background: "transparent",
                  border: "none",
                  color: isActive ? "var(--color-burgundy)" : "var(--color-text-dim)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: "10px",
                  zIndex: 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)";
                  }
                }}
              >
                <tab.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status */}
        <div style={{
          padding: "1.25rem 1.75rem",
          borderTop: "1px solid var(--color-border-light)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <span style={{
              position: "relative",
              display: "inline-block",
              width: "8px",
              height: "8px",
            }}>
              <span style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--color-taupe)",
              }} />
              <span style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--color-taupe)",
                opacity: 0.4,
                animation: "pulse 2.4s var(--ease-in-out) infinite",
              }} />
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", letterSpacing: "0.02em" }}>
              Live · synced with your scrapes
            </span>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.2); opacity: 0; }
        }

        /* ==== Desktop (default) ==== */
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }
        .sidebar-backdrop { display: none; }
        .sidebar-close { display: none; }

        /* ==== Mobile drawer (≤768px) ==== */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            max-width: 84vw;
            min-height: 100dvh;
            transform: translateX(-100%);
            transition: transform 280ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
            z-index: 50;
            box-shadow: 0 12px 40px -8px rgba(50, 24, 24, 0.18);
            overflow-y: auto;
          }
          .sidebar.is-open {
            transform: translateX(0);
          }
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(38, 18, 14, 0);
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            transition: background 220ms ease, backdrop-filter 220ms ease;
            z-index: 40;
            pointer-events: none;
          }
          .sidebar-backdrop.is-open {
            background: rgba(38, 18, 14, 0.32);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            pointer-events: auto;
          }
          .sidebar-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: transparent;
            border: none;
            color: var(--color-text-dim);
            cursor: pointer;
            margin-top: -4px;
            transition: background 180ms ease, color 180ms ease;
          }
          .sidebar-close:hover,
          .sidebar-close:focus-visible {
            background: var(--color-cream);
            color: var(--color-burgundy);
          }
        }
      `}</style>
    </>
  );
}

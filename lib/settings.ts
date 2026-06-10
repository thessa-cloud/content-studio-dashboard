/**
 * Effective settings — the single source the UI reads for brand identity,
 * competitor list, and trigger words (with offer/topic/promise).
 *
 * Resolution order:
 *   1. /api/data?tab=settings  → row in Supabase public.settings (most recent edit)
 *   2. localStorage "cs-settings"  → for the white-label demo and any deploy
 *      that does not have Supabase env vars wired yet
 *   3. config.json fallback  → the deploy-default values shipped in the repo
 *
 * Backwards compat: a customer might still have legacy string-array trigger
 * words in config.json (`"triggerWords": ["STUDIO","BUNDLE"]`). Those normalize
 * to `[{word:"STUDIO", offer:"", topic:"", promise:""}, …]` with a "needs setup"
 * flag the Settings form surfaces as an empty-state badge.
 *
 * Why localStorage instead of refusing to render when no Supabase: the demo
 * deploy at studio.revenu-academy.nl has zero Supabase env vars on purpose —
 * we don't want a public demo writing to a shared DB. Customers see the
 * forms working (localStorage persists across visits in their own browser),
 * which lets them feel the UX before they paste their own Supabase keys.
 */
import config from "../config.json";

export type TriggerTriplet = {
  word: string;
  offer: string;
  topic: string;
  promise: string;
};

export type EffectiveSettings = {
  brand_name: string;
  instagram_handle: string;
  competitors: string[];
  trigger_words: TriggerTriplet[];
  // Telemetry — UI uses these to render the "needs setup" badges and
  // "Save to Supabase failed, saved locally instead" hints.
  source: "supabase" | "localStorage" | "config";
  has_legacy_triggers: boolean;
};

const LS_KEY = "cs-settings";

function normalizeTriggers(raw: unknown): {
  triggers: TriggerTriplet[];
  hadLegacy: boolean;
} {
  if (!Array.isArray(raw)) return { triggers: [], hadLegacy: false };
  let hadLegacy = false;
  const triggers = raw
    .map((t): TriggerTriplet | null => {
      if (typeof t === "string") {
        hadLegacy = true;
        return { word: t, offer: "", topic: "", promise: "" };
      }
      if (t && typeof t === "object") {
        const o = t as Record<string, unknown>;
        return {
          word: typeof o.word === "string" ? o.word : "",
          offer: typeof o.offer === "string" ? o.offer : "",
          topic: typeof o.topic === "string" ? o.topic : "",
          promise: typeof o.promise === "string" ? o.promise : "",
        };
      }
      return null;
    })
    .filter((t): t is TriggerTriplet => t !== null && t.word.trim().length > 0);
  return { triggers, hadLegacy };
}

function fromConfig(): EffectiveSettings {
  const { triggers, hadLegacy } = normalizeTriggers(
    (config as { triggerWords?: unknown }).triggerWords
  );
  return {
    brand_name: (config as { brandName?: string }).brandName ?? "",
    instagram_handle: (config as { instagramHandle?: string }).instagramHandle ?? "",
    competitors: Array.isArray((config as { competitors?: unknown }).competitors)
      ? ((config as { competitors?: string[] }).competitors ?? []).map((c) => c.replace(/^@/, ""))
      : [],
    trigger_words: triggers,
    source: "config",
    has_legacy_triggers: hadLegacy,
  };
}

function readLocalStorage(): EffectiveSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { triggers, hadLegacy } = normalizeTriggers(parsed.trigger_words);
    return {
      brand_name: typeof parsed.brand_name === "string" ? parsed.brand_name : "",
      instagram_handle:
        typeof parsed.instagram_handle === "string"
          ? parsed.instagram_handle.replace(/^@/, "")
          : "",
      competitors: Array.isArray(parsed.competitors)
        ? (parsed.competitors as unknown[])
            .filter((c): c is string => typeof c === "string")
            .map((c) => c.replace(/^@/, ""))
        : [],
      trigger_words: triggers,
      source: "localStorage",
      has_legacy_triggers: hadLegacy,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the effective settings. Tries Supabase first; on null/error falls
 * back to localStorage; on still-null returns config.json.
 *
 * Safe to call from a client component. The Supabase round-trip goes through
 * the dashboard's own /api/data endpoint (which uses the service role server-
 * side) so credentials never reach the browser.
 */
export async function fetchEffectiveSettings(): Promise<EffectiveSettings> {
  // Try Supabase via API.
  try {
    const res = await fetch("/api/data?tab=settings", { cache: "no-store" });
    const json = (await res.json()) as { data: Record<string, unknown> | null };
    if (json.data && typeof json.data === "object") {
      // The Supabase row IS the authority once it exists. If a customer
      // deleted their last trigger and saved, an empty `trigger_words` array
      // is what they meant, not a signal to fall back to config.json's legacy
      // defaults. Same applies to brand_name / instagram_handle / competitors:
      // null / "" / [] is the customer's intent, surface it verbatim. The
      // config.json fallback only kicks in when there is NO row at all
      // (further down).
      const d = json.data;
      const { triggers, hadLegacy } = normalizeTriggers(d.trigger_words);
      return {
        brand_name: typeof d.brand_name === "string" ? d.brand_name : "",
        instagram_handle:
          typeof d.instagram_handle === "string"
            ? d.instagram_handle.replace(/^@/, "")
            : "",
        competitors: Array.isArray(d.competitors)
          ? (d.competitors as unknown[])
              .filter((c): c is string => typeof c === "string")
              .map((c) => c.replace(/^@/, ""))
          : [],
        trigger_words: triggers,
        source: "supabase",
        has_legacy_triggers: hadLegacy,
      };
    }
  } catch {
    // Network error or Supabase unreachable — fall through.
  }
  // Try localStorage.
  const ls = readLocalStorage();
  if (ls) return ls;
  // Last resort: deploy default in config.json.
  return fromConfig();
}

/**
 * Persist settings. Tries the Supabase upsert via PUT; on 503 (no Supabase
 * configured) falls back to localStorage. Returns the source that actually
 * accepted the write so the UI can render the appropriate confirmation.
 */
export async function saveEffectiveSettings(
  next: Pick<EffectiveSettings, "brand_name" | "instagram_handle" | "competitors" | "trigger_words">
): Promise<{ ok: boolean; source: "supabase" | "localStorage"; error?: string }> {
  // Try the API first.
  try {
    const res = await fetch("/api/data?tab=settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (res.ok) return { ok: true, source: "supabase" };
    // 503 = Supabase not configured; 400/500 = some other error.
    if (res.status !== 503) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, source: "supabase", error: body?.error ?? `HTTP ${res.status}` };
    }
  } catch {
    // Fall through to localStorage.
  }
  // Persist to localStorage so the page reloads with the customer's edits.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
      return { ok: true, source: "localStorage" };
    } catch (e) {
      return { ok: false, source: "localStorage", error: (e as Error).message };
    }
  }
  return { ok: false, source: "localStorage", error: "No window" };
}

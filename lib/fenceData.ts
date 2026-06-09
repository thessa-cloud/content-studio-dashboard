/**
 * fenceData.
 *
 * Wraps a raw data payload in a fenced ```LABEL``` block so Claude treats it as
 * literal context, not free-form prose to interpret.
 *
 * Lives in a plain `.ts` util (no React, no "use client") so it can be
 * imported safely from anywhere — promptBuilders.ts, server components,
 * route handlers, client components alike. It used to be re-exported from
 * `CopyPromptButton.tsx` (a client component) which made the dependency
 * graph fragile: any server import path would pull the client module in.
 */
export function fenceData(label: string, payload: unknown): string {
  const body =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return `\n\n\`\`\`${label}\n${body}\n\`\`\`\n`;
}

import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const FUNCTION_SECRET = process.env.FUNCTION_SECRET!;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { mode?: string };
  const mode = body.mode ?? "all";

  const res = await fetch(`${SUPABASE_URL}/functions/v1/content-scraper`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FUNCTION_SECRET}`,
    },
    body: JSON.stringify({ mode }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : 500 });
}

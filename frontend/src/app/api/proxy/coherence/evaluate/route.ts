import type { NextRequest } from "next/server";
import { getRawToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const token = await getRawToken(req);
  if (!token) return new Response("Unauthorized", { status: 401 });

  // body contoh: { response: string, prompt?: string }
  const body = await req.json();

  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/coherence/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return new Response(await r.text(), { status: r.status });
}

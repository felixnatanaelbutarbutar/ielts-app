// src/app/api/proxy/grammar/correct/route.ts
import { getRawToken } from "@/lib/tokens";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getRawToken(req);
  if (!token) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/grammar/correct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return new Response(await r.text(), { status: r.status });
}

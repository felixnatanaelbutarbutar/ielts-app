// src/app/api/proxy/asr/analyze/route.ts
import { getRawToken } from "@/lib/tokens";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getRawToken(req);
  if (!token) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData(); // forward multipart apa adanya
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/asr/analyze`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // penting: JANGAN set 'Content-Type' manual untuk FormData
    },
    body: formData,
  });
  return new Response(await r.text(), { status: r.status });
}

import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// src/app/api/proxy/asr/record/route.ts
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, raw: true });
  const form = await req.formData();
  const sessionId = form.get("session_id");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/asr/record?session_id=${sessionId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  return new Response(await res.text(), { status: res.status });
}
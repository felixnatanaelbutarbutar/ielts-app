// src/app/api/proxy/asr/test-mic/route.ts
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, raw: true });
  if (!token) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("audio") as File;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/asr/test-mic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  return new Response(await res.text(), { status: res.status });
}
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// src/app/api/proxy/artifacts/[sessionId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, raw: true });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/artifacts/${params.sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return Response.json(data);
}
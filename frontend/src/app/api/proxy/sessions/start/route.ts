// frontend/src/app/api/proxy/sessions/route.ts
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  const claims = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!claims) return new Response("Unauthorized", { status: 401 });

  const appToken = await new SignJWT({
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
    })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!));

  const body = await req.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${appToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new Response(await res.text(), { status: res.status });
}

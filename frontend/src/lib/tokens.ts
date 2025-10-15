// src/lib/tokens.ts
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getRawToken(req: NextRequest) {
  const raw = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET!, 
    raw: true });
  return raw ? raw as string : null;
}
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "@/lib/db";
import { v4 as uuidv4 } from 'uuid'; // TAMBAH INI

const handler = NextAuth({
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    /** Simpan / perbarui user ke DB saat sukses sign-in */
    async signIn({ user, account }) {
      if (!user?.email) return false;
      const client = await pool.connect();
      try {
        const userId = uuidv4(); // UUID OTOMATIS DARI CODE
        const q = `
          INSERT INTO users (id, email, name, provider, provider_id, created_at)
          VALUES ($1, $2, $3, 'google', $4, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name,
                provider_id = EXCLUDED.provider_id
          RETURNING id
        `;
        const res = await client.query(q, [
          userId,
          user.email,
          user.name ?? null,
          account?.providerAccountId ?? null
        ]);
        console.log("User saved with ID:", res.rows[0].id);
        return true;
      } catch (err) {
        console.error("Error saving user:", err);
        return false;
      } finally {
        client.release();
      }
    },
    /** Tambahkan info ke token JWT */
    async jwt({ token, account, profile }) {
      if (profile && profile.email) token.email = profile.email as string;
      if (account?.providerAccountId) token.providerId = account.providerAccountId;
      return token;
    },
    /** Session untuk client */
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        // @ts-expect-error
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
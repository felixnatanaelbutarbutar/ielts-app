// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "@/lib/db";

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
        // upsert berdasarkan email; boleh juga pakai (provider, provider_id)
        // src/app/api/auth/[...nextauth]/route.ts  (di callback signIn)
        const q = `
          INSERT INTO users (email, name, provider, provider_id, created_at)
          VALUES ($1, $2, 'google', $3, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name
          RETURNING id
        `;
        await client.query(q, [user.email, user.name ?? null, account?.providerAccountId ?? null]);

        return true;
      } catch (err) {
        console.error("Error saving user:", err);
        return false;
      } finally {
        client.release();
      }
    },

    /** Tambahkan info ke token JWT kalau perlu */
    async jwt({ token, account, profile }) {
      // token.sub biasanya berisi user identifier yang stabil
      if (profile && profile.email) token.email = profile.email as string;
      if (account?.providerAccountId) token.providerId = account.providerAccountId;
      return token;
    },

    /** Bentuk object session yang dipakai di client */
    /** Bentuk object session yang dipakai di client */
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        // tambahkan id manual, tapi beri tahu TypeScript bahwa ini memang tidak didefinisikan di tipe default
        // @ts-expect-error: session.user default tidak punya field "id"
        session.user.id = token.sub;
      }
      return session;
    },

  },
});

export { handler as GET, handler as POST };

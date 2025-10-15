import { DefaultSession, DefaultJWT } from 'next-auth';
import { DefaultAccount } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
    } & DefaultSession['user'];  
  }

  interface Account extends DefaultAccount {
    email: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    email?: string | null;
  }
}
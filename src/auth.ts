import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { seedUserFinance } from "@/server/finance/seed-user-finance";
import { authProviders } from "@/lib/auth/providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: authProviders(),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return true;

      const hasFinance = await prisma.financeAccount.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!hasFinance) {
        await seedUserFinance(user.id);
      }

      if (user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        // Persist role into the token so no per-request DB call is needed in
        // middleware (which runs on the edge). Sourced from the provider's
        // returned user / the Prisma adapter user.
        const role = (user as { role?: "USER" | "ADMIN" }).role;
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = ((token.role as "USER" | "ADMIN" | undefined) ?? "USER");
      }
      return session;
    },
  },
  trustHost: true,
});

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { db } from "@prism/db";
import { Resend } from "resend";
import { env } from "~/env";
import { InviteEmail } from "~/components/auth/invite-email";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  session: {
    fields: {
      expiresAt: "expires",
      token: "sessionToken",
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    updateAge: 24 * 60 * 60, // 24 hours
    strategy: "jwt",
  },
  account: {
    fields: {
      accountId: "providerAccountId",
      refreshToken: "refresh_token",
      accessToken: "access_token",
      idToken: "id_token",
      providerId: "provider",
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const members = await db.member.findFirst({
            where: {
              userId: session.userId,
            },
            include: {
              organization: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: members?.organization.id || null,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      creatorRole: "owner",
      invitationExpiresIn: 7 * 24 * 60 * 60,
      cancelPendingInvitationsOnReInvite: true,
      invitationLimit: 100,
      async sendInvitationEmail(data: {
        id: string;
        email: string;
        organization: { name: string };
        inviter: { user: { name: string } };
      }) {
        const inviteLink =
          process.env.NODE_ENV === "development"
            ? `http://localhost:3000/accept-invitation/${data.id}`
            : `https://deliberate-innovation-web.vercel.app/accept-invitation/${data.id}`;
        await resend.emails.send({
          from: "Deliberate Innovation <alex@prismai.sh>",
          to: data.email,
          subject: `You've been invited to join ${data.organization.name} on Deliberate Innovation`,
          react: InviteEmail({
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name,
            inviteLink,
          }),
        });
      },
    }),
    nextCookies(),
  ],
  api: {
    enabled: true,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "Deliberate Innovation <alex@prismai.sh>",
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
});

export type Session = typeof auth.$Infer.Session;

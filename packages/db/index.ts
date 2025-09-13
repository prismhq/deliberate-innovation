import { PrismaClient } from "@prisma/client";

import { env } from "./env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export {
  PrismaClient,
  Prisma,
  Role,
  CollectionStatus,
  InvitationStatus,
  type Organization,
  type User,
  type Profile,
  type Member,
  type Collection,
  type CollectionMember,
  type Document,
  type Invitation,
  type Account,
  type Session,
  type VerificationToken,
} from "@prisma/client";

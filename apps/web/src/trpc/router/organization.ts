import { Role } from "@prism/db";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import { randomBytes } from "crypto";

export const organizationRouter = createTRPCRouter({
  getCollections: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.collection.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: "desc" },
      });
    }),

  getMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgUsers = await ctx.db.member.findMany({
        where: { organizationId: input.organizationId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return orgUsers.map((orgUser) => ({
        ...orgUser.user,
        role: orgUser.role,
        joinedAt: orgUser.createdAt,
      }));
    }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existingOrg = await ctx.db.organization.findUnique({
          where: { slug },
        });
        if (!existingOrg) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug,
          metadata: JSON.stringify({
            createdBy: ctx.session.user.id,
          }),
          members: {
            create: [
              {
                userId: ctx.session.user.id,
                role: Role.OWNER,
              },
            ],
          },
        },
      });

      const collection = await ctx.db.collection.create({
        data: {
          name: "Default Collection",
          slug: "default-collection",
          organizationId: organization.id,
          status: "ACTIVE",
        },
      });

      // Get all organization members
      const orgMembers = await ctx.db.member.findMany({
        where: { organizationId: organization.id },
      });

      // Create collection members for each org member
      await ctx.db.collectionMember.createMany({
        data: orgMembers.map((member) => ({
          collectionId: collection.id,
          userId: member.userId,
          role: member.role === Role.OWNER ? Role.ADMIN : Role.USER,
        })),
      });

      return {
        organization,
        collection,
      };
    }),

  getActiveOrganization: protectedProcedure.query(async ({ ctx }) => {
    // First check if there's an active organization stored in the session
    const session = await ctx.db.session.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let activeOrganizationId = session?.activeOrganizationId;

    // If no active org in session, or the stored org doesn't exist/user isn't a member,
    // fall back to the first organization the user is a member of
    if (!activeOrganizationId) {
      const firstMembership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      activeOrganizationId = firstMembership?.organizationId;
    }

    if (!activeOrganizationId) {
      return null;
    }

    // Verify user is still a member of this organization
    const member = await ctx.db.member.findFirst({
      where: {
        userId: ctx.session.user.id,
        organizationId: activeOrganizationId,
      },
    });

    if (!member) {
      // User is no longer a member, fall back to first available organization
      const firstMembership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return firstMembership?.organization || null;
    }

    // Return the active organization
    return ctx.db.organization.findFirst({
      where: {
        id: activeOrganizationId,
      },
    });
  }),

  getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.member.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return members.map((member) => member.organization);
  }),

  setActiveOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a member of this organization
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
        include: {
          organization: true,
        },
      });

      if (!member) {
        throw new Error(
          "Access denied: You are not a member of this organization"
        );
      }

      // Update the user's session to store the active organization
      await ctx.db.session.updateMany({
        where: {
          userId: ctx.session.user.id,
        },
        data: {
          activeOrganizationId: input.organizationId,
        },
      });

      return member.organization;
    }),

  createApiKey: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(50),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a member of this organization
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      if (!member) {
        throw new Error(
          "Access denied: You are not a member of this organization"
        );
      }

      // Generate a secure API key
      const apiKey = `pk_${randomBytes(32).toString("hex")}`;

      // Create metadata object for the API key
      const apiKeyMetadata = {
        id: randomBytes(16).toString("hex"),
        key: apiKey,
        name: input.name,
        description: input.description,
        createdAt: new Date().toISOString(),
        createdBy: ctx.session.user.id,
      };

      // Get current organization
      const organization = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Add the new API key metadata to the array
      const updatedApiKeys = [
        ...organization.apiKeys,
        JSON.stringify(apiKeyMetadata),
      ];

      // Update organization with new API key
      await ctx.db.organization.update({
        where: { id: input.organizationId },
        data: {
          apiKeys: updatedApiKeys,
        },
      });

      return {
        apiKey,
        id: apiKeyMetadata.id,
        name: input.name,
        description: input.description,
        createdAt: apiKeyMetadata.createdAt,
      };
    }),

  getApiKeys: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user is a member of this organization
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      if (!member) {
        throw new Error(
          "Access denied: You are not a member of this organization"
        );
      }

      // Get organization with API keys
      const organization = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Parse API key metadata and return masked keys
      const apiKeys = organization.apiKeys
        .map((keyString) => {
          try {
            const metadata = JSON.parse(keyString);
            return {
              id: metadata.id,
              name: metadata.name,
              description: metadata.description,
              createdAt: metadata.createdAt,
              maskedKey: `pk_****${metadata.key.slice(-4)}`, // Show only last 4 chars
            };
          } catch (error) {
            // Handle any parsing errors gracefully
            console.error("Error parsing API key metadata:", error);
            return null;
          }
        })
        .filter(Boolean); // Remove any null values from parsing errors

      return apiKeys;
    }),

  deleteApiKey: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        apiKeyId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a member of this organization
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      if (!member) {
        throw new Error(
          "Access denied: You are not a member of this organization"
        );
      }

      // Get current organization
      const organization = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Filter out the API key to delete
      const updatedApiKeys = organization.apiKeys.filter((keyString) => {
        try {
          const metadata = JSON.parse(keyString);
          return metadata.id !== input.apiKeyId;
        } catch (error) {
          // Keep malformed entries for now, but log the error
          console.error("Error parsing API key metadata:", error);
          return true;
        }
      });

      // Update organization
      await ctx.db.organization.update({
        where: { id: input.organizationId },
        data: {
          apiKeys: updatedApiKeys,
        },
      });

      return { success: true };
    }),
});

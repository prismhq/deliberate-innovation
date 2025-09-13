import { Role } from "@prism/db";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";

export const collectionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the user has access to this collection through organization membership
      const collection = await ctx.db.collection.findUnique({
        where: { id: input.collectionId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
          collectionMembers: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          documents: true,
        },
      });

      if (!collection) {
        throw new Error("Collection not found");
      }

      // Check if user is a member of the organization that owns this collection
      if (collection.organization.members.length === 0) {
        throw new Error(
          "Access denied: You are not a member of this organization"
        );
      }

      return collection;
    }),

  getMembers: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the user has access to this collection
      const collection = await ctx.db.collection.findUnique({
        where: { id: input.collectionId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!collection || collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      // Get collection members
      const collectionMembers = await ctx.db.collectionMember.findMany({
        where: { collectionId: input.collectionId },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return collectionMembers.map((member) => ({
        ...member.user,
        role: member.role,
        joinedAt: member.createdAt,
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the user is a member of this organization
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

      // Generate slug from name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existingCollection = await ctx.db.collection.findFirst({
          where: {
            slug,
            organizationId: input.organizationId,
          },
        });
        if (!existingCollection) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create the collection
      const collection = await ctx.db.collection.create({
        data: {
          name: input.name,
          description: input.description,
          slug,
          organizationId: input.organizationId,
          status: "ACTIVE",
        },
      });

      // Get all organization members
      const orgMembers = await ctx.db.member.findMany({
        where: { organizationId: input.organizationId },
      });

      // Create collection members for each org member
      await ctx.db.collectionMember.createMany({
        data: orgMembers.map((orgMember) => ({
          collectionId: collection.id,
          userId: orgMember.userId,
          role: orgMember.role === Role.OWNER ? Role.ADMIN : Role.USER,
        })),
      });

      return collection;
    }),

  update: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        settings: z.record(z.string(), z.any()).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { collectionId, ...updateData } = input;

      // First verify the user has access to this collection
      const collection = await ctx.db.collection.findUnique({
        where: { id: collectionId },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (!collection || collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      // Update the collection
      return ctx.db.collection.update({
        where: { id: collectionId },
        data: {
          ...updateData,
          settings: updateData.settings
            ? JSON.stringify(updateData.settings)
            : undefined,
          metadata: updateData.metadata
            ? JSON.stringify(updateData.metadata)
            : undefined,
        },
      });
    }),
});

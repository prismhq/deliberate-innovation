import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";

export const documentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Create new document
      return ctx.db.document.create({
        data: {
          collectionId: input.collectionId,
          text: input.text,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userName: z.string().optional(),
        text: z.string(),
        domain: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // First verify the user has access to this document's collection
      const document = await ctx.db.document.findUnique({
        where: { id },
        include: {
          collection: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId: ctx.session.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (!document || document.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      // Filter out undefined values and convert empty strings to null
      const filteredUpdateData = Object.entries(updateData).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value === "" ? null : value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Update the document
      return ctx.db.document.update({
        where: { id },
        data: filteredUpdateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the user has access to this document's collection
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          collection: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId: ctx.session.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (!document || document.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      // Delete the document
      return ctx.db.document.delete({
        where: { id: input.id },
      });
    }),

  getByCollectionId: protectedProcedure
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

      // Get documents for this collection
      return ctx.db.document.findMany({
        where: { collectionId: input.collectionId },
        orderBy: { createdAt: "desc" },
      });
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";

export const situationDiagramsRouter = createTRPCRouter({
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

      // Get situation diagrams for this collection
      return ctx.db.situationDiagram.findMany({
        where: { collectionId: input.collectionId },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        title: z.string().min(1),
        actions: z.array(z.string()).default([]),
        relations: z.array(z.string()).default([]),
        resources: z.array(z.string()).default([]),
        channels: z.array(z.string()).default([]),
        positionX: z.number().default(0),
        positionY: z.number().default(0),
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

      return ctx.db.situationDiagram.create({
        data: {
          title: input.title,
          actions: input.actions,
          relations: input.relations,
          resources: input.resources,
          channels: input.channels,
          positionX: input.positionX,
          positionY: input.positionY,
          collectionId: input.collectionId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        actions: z.array(z.string()).optional(),
        relations: z.array(z.string()).optional(),
        resources: z.array(z.string()).optional(),
        channels: z.array(z.string()).optional(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // First verify the user has access to this situation diagram
      const diagram = await ctx.db.situationDiagram.findUnique({
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

      if (!diagram || diagram.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      return ctx.db.situationDiagram.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the user has access to this situation diagram
      const diagram = await ctx.db.situationDiagram.findUnique({
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

      if (!diagram || diagram.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      return ctx.db.situationDiagram.delete({
        where: { id: input.id },
      });
    }),
});

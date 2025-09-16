import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import { env } from "~/env";
import {
  generateNotNotsForDocument,
  type DocumentForNotNot,
} from "~/lib/not-not-generator";

/**
 * Helper function to generate NotNots for a document
 */
async function tryGenerateNotNots(
  ctx: any,
  documentId: string,
  documentTitle: string,
  documentText: string,
  collectionId: string
) {
  try {
    const processedDocument: DocumentForNotNot = {
      id: documentId,
      title: documentTitle,
      text: documentText,
      collectionId: collectionId,
    };

    // Generate NotNots for this document
    const notNotCandidates = await generateNotNotsForDocument(processedDocument);

    if (notNotCandidates.length > 0) {
      // Save NotNots to database
      await ctx.db.$transaction(async (tx: any) => {
        for (const candidate of notNotCandidates) {
          await tx.notNot.create({
            data: {
              title: candidate.title,
              description: candidate.description,
              collectionId: collectionId,
              documentId: candidate.documentId,
              metadata: candidate.metadata,
            },
          });
        }
      });

      console.log(
        `Generated ${notNotCandidates.length} NotNots for document "${documentTitle}"`
      );
    } else {
      console.log(`No NotNots generated for document "${documentTitle}"`);
    }
  } catch (error) {
    console.error(
      `Failed to generate NotNots for document ${documentId}:`,
      error
    );
    // Don't throw - NotNot generation is optional and shouldn't break document creation
  }
}

export const documentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        text: z.string(),
        title: z.string(),
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

      // Create new document first
      const document = await ctx.db.document.create({
        data: {
          collectionId: input.collectionId,
          text: input.text,
          title: input.title,
        },
      });

      // Generate NotNots for this document if text is provided
      if (input.text.trim()) {
        await tryGenerateNotNots(
          ctx,
          document.id,
          document.title,
          input.text,
          input.collectionId
        );
      }

      return document;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
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
        {} as Record<string, string | null>
      );

      // Update the document first
      const updatedDocument = await ctx.db.document.update({
        where: { id },
        data: filteredUpdateData,
      });

      // Generate NotNots if text is being updated
      if (
        filteredUpdateData.text &&
        typeof filteredUpdateData.text === "string" &&
        filteredUpdateData.text.trim()
      ) {
        await tryGenerateNotNots(
          ctx,
          id,
          updatedDocument.title,
          filteredUpdateData.text,
          updatedDocument.collectionId
        );
      }

      return updatedDocument;
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

      // Get documents for this collection with notNots count
      return ctx.db.document.findMany({
        where: { collectionId: input.collectionId },
        include: {
          _count: {
            select: {
              notNots: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getByIdWithNotNots: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the user has access to this document's collection
      const document = await ctx.db.document.findUnique({
        where: { id: input.documentId },
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
          notNots: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!document || document.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      return document;
    }),
});

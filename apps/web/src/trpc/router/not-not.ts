import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import {
  generateNotNotsFromDocuments,
  generateNotNotsForDocument,
  type DocumentForNotNot,
} from "~/lib/not-not-generator";

export const notNotRouter = createTRPCRouter({
  /**
   * Generate not-nots for a collection by clustering documents and analyzing with OpenAI
   */
  generateForCollection: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
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
          documents: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!collection || collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      if (collection.documents.length === 0) {
        throw new Error("Need at least 1 document to generate not-nots");
      }

      // Get all documents for this collection
      const processedDocuments: DocumentForNotNot[] = collection.documents.map(
        (doc) => ({
          id: doc.id,
          title: doc.title,
          text: doc.text,
          collectionId: doc.collectionId,
        })
      );

      // Generate not-nots using the clustering service
      const notNotCandidates =
        await generateNotNotsFromDocuments(processedDocuments);

      if (notNotCandidates.length === 0) {
        return { generated: 0, notNots: [] };
      }

      // Save not-nots to database in a transaction
      const savedNotNots = await ctx.db.$transaction(async (tx) => {
        const results = [];

        for (const candidate of notNotCandidates) {
          // Create the not-not record
          const notNot = await tx.notNot.create({
            data: {
              title: candidate.title,
              description: candidate.description,
              collectionId: input.collectionId,
              documentId: candidate.documentId,
              metadata: candidate.metadata,
            },
          });

          results.push(notNot);
        }

        return results;
      });

      return {
        generated: savedNotNots.length,
        notNots: savedNotNots,
      };
    }),

  /**
   * Get all not-nots for a collection
   */
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

      // Get not-nots for this collection with their associated document
      const notNots = await ctx.db.notNot.findMany({
        where: { collectionId: input.collectionId },
        include: {
          document: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform the data for easier use in UI
      return notNots.map((notNot) => ({
        id: notNot.id,
        title: notNot.title,
        description: notNot.description,
        createdAt: notNot.createdAt,
        updatedAt: notNot.updatedAt,
        metadata: notNot.metadata,
        document: {
          id: notNot.document.id,
          title: notNot.document.title,
        },
      }));
    }),

  /**
   * Generate not-nots for a single document
   */
  generateForDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the user has access to this document
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
        },
      });

      if (!document || document.collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      const processedDocument: DocumentForNotNot = {
        id: document.id,
        title: document.title,
        text: document.text,
        collectionId: document.collectionId,
      };

      // Generate not-nots for this single document
      const notNotCandidates =
        await generateNotNotsForDocument(processedDocument);

      if (notNotCandidates.length === 0) {
        return { generated: 0, notNots: [] };
      }

      // Save not-nots to database in a transaction
      const savedNotNots = await ctx.db.$transaction(async (tx) => {
        const results = [];

        for (const candidate of notNotCandidates) {
          // Create the not-not record
          const notNot = await tx.notNot.create({
            data: {
              title: candidate.title,
              description: candidate.description,
              collectionId: document.collectionId,
              documentId: candidate.documentId,
              metadata: candidate.metadata,
            },
          });

          results.push(notNot);
        }

        return results;
      });

      return {
        generated: savedNotNots.length,
        notNots: savedNotNots,
      };
    }),

  /**
   * Delete a not-not (admin function)
   */
  delete: protectedProcedure
    .input(z.object({ notNotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the user has access to the collection that owns this not-not
      const notNot = await ctx.db.notNot.findUnique({
        where: { id: input.notNotId },
        include: {
          document: {
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
          },
        },
      });

      if (!notNot) {
        throw new Error("Not-not not found");
      }

      // Check if user has access through the document's collection
      const hasAccess =
        notNot.document.collection.organization.members.length > 0;

      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Delete the not-not (cascade will handle document links)
      await ctx.db.notNot.delete({
        where: { id: input.notNotId },
      });

      return { success: true };
    }),

  /**
   * Get generation status for a collection (useful for checking if generation is needed)
   */
  getGenerationStatus: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify access
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
          documents: {
            select: { id: true, createdAt: true },
          },
        },
      });

      if (!collection || collection.organization.members.length === 0) {
        throw new Error("Access denied");
      }

      // Get the most recent not-not generation
      const latestNotNot = await ctx.db.notNot.findFirst({
        where: { collectionId: input.collectionId },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          metadata: true,
        },
      });

      // Get count of documents in the collection
      const documentCount = collection.documents.length;

      // Check if we have enough documents for generation
      const eligibleForGeneration = documentCount >= 1;

      // Check if generation is needed (new documents since last generation)
      let generationNeeded = false;
      if (eligibleForGeneration && latestNotNot) {
        const documentsAfterLastGeneration = collection.documents.filter(
          (doc) => doc.createdAt > latestNotNot.createdAt
        );
        generationNeeded = documentsAfterLastGeneration.length > 0;
      } else if (eligibleForGeneration && !latestNotNot) {
        generationNeeded = true;
      }

      return {
        eligibleForGeneration,
        generationNeeded,
        documentCount: documentCount,
        lastGenerationAt: latestNotNot?.createdAt || null,
        lastGenerationMetadata: latestNotNot?.metadata || null,
      };
    }),
});

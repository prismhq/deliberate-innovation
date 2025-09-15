import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import {
  generateNotNotsFromDocuments,
  type DocumentWithEmbedding,
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

      if (collection.documents.length < 5) {
        throw new Error("Need at least 5 documents to generate not-nots");
      }

      // Get documents with embeddings using raw SQL to handle vector type
      const documentsWithEmbeddings = await ctx.db.$queryRaw<
        Array<{
          id: string;
          title: string;
          text: string;
          embedding: string | null;
          collectionId: string;
        }>
      >`
        SELECT id, title, text, embedding::text as embedding, "collection_id" as "collectionId"
        FROM "Document"
        WHERE "collection_id" = ${input.collectionId}
        AND embedding IS NOT NULL
        ORDER BY "created_at" DESC
      `;

      if (documentsWithEmbeddings.length < 5) {
        throw new Error(
          "Need at least 5 documents with embeddings to generate not-nots"
        );
      }

      // Parse embeddings from string format
      const processedDocuments: DocumentWithEmbedding[] =
        documentsWithEmbeddings
          .map((doc) => {
            let parsedEmbedding: number[] = [];

            if (doc.embedding) {
              try {
                // PostgreSQL vector format is typically [x,y,z] - clean and parse
                const vectorStr = doc.embedding.replace(/[[\]]/g, "").trim();
                parsedEmbedding = vectorStr
                  .split(",")
                  .map(parseFloat)
                  .filter((n) => !isNaN(n));
              } catch (error) {
                console.error(
                  `Error parsing embedding for document ${doc.id}:`,
                  error
                );
              }
            }

            return {
              id: doc.id,
              title: doc.title,
              text: doc.text,
              embedding: parsedEmbedding,
              collectionId: doc.collectionId,
            };
          })
          .filter((doc) => doc.embedding.length > 0); // Only include docs with valid embeddings

      if (processedDocuments.length < 5) {
        throw new Error("Need at least 5 documents with valid embeddings");
      }

      console.log(
        `Generating not-nots for collection ${input.collectionId} with ${processedDocuments.length} documents`
      );

      // Generate not-nots using the clustering service
      const notNotCandidates =
        await generateNotNotsFromDocuments(processedDocuments);

      if (notNotCandidates.length === 0) {
        console.log("No valid not-nots generated from document clustering");
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
              clusterMetadata: candidate.clusterMetadata,
            },
          });

          // Create document links
          if (candidate.supportingDocuments.length > 0) {
            await tx.notNotDocumentLink.createMany({
              data: candidate.supportingDocuments.map((documentId) => ({
                notNotId: notNot.id,
                documentId,
              })),
            });
          }

          results.push(notNot);
        }

        return results;
      });

      console.log(
        `Successfully saved ${savedNotNots.length} not-nots to database`
      );

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

      // Get not-nots for this collection with their supporting documents
      const notNots = await ctx.db.notNot.findMany({
        where: { collectionId: input.collectionId },
        include: {
          documentLinks: {
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                },
              },
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
        clusterMetadata: notNot.clusterMetadata,
        supportingDocuments: notNot.documentLinks.map((link) => ({
          id: link.document.id,
          title: link.document.title,
        })),
        supportingDocumentCount: notNot.documentLinks.length,
      }));
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
          documentLinks: {
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
          },
        },
      });

      if (!notNot) {
        throw new Error("Not-not not found");
      }

      // Check if user has access through any of the supporting documents' collections
      const hasAccess = notNot.documentLinks.some(
        (link) => link.document.collection.organization.members.length > 0
      );

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
          clusterMetadata: true,
        },
      });

      // Get count of documents with embeddings using raw SQL
      const documentsWithEmbeddingsResult = await ctx.db.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*) as count
        FROM "Document"
        WHERE "collection_id" = ${input.collectionId}
        AND embedding IS NOT NULL
      `;

      const documentsWithEmbeddingsCount = Number(
        documentsWithEmbeddingsResult[0]?.count ?? 0
      );

      // Check if we have enough documents for generation
      const eligibleForGeneration = documentsWithEmbeddingsCount >= 5;

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
        documentCount: documentsWithEmbeddingsCount,
        lastGenerationAt: latestNotNot?.createdAt || null,
        lastGenerationMetadata: latestNotNot?.clusterMetadata || null,
      };
    }),
});

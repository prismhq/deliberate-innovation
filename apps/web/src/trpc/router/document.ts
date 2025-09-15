import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import { EmbeddingClient } from "~/lib/embedding";
import { env } from "~/env";

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

      // Generate and store embedding if text is provided
      if (input.text.trim() && process.env.OPENAI_API_KEY) {
        try {
          const embeddingClient = new EmbeddingClient({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const embedding = await embeddingClient.generateEmbedding(input.text);

          // Update document with embedding using raw SQL
          await ctx.db.$executeRaw`
            UPDATE "Document"
            SET embedding = ${JSON.stringify(embedding)}::vector
            WHERE id = ${document.id}
          `;
        } catch (error) {
          console.error("Failed to generate embedding:", error);
          // Document is still created successfully even if embedding fails
        }
      }

      // Check if collection now has enough documents for not-not generation
      // Run this asynchronously to not block document creation
      setTimeout(async () => {
        try {
          // Get document count for this collection with embeddings using raw SQL
          const documentCountResult = await ctx.db.$queryRaw<
            Array<{ count: bigint }>
          >`
            SELECT COUNT(*) as count
            FROM "Document"
            WHERE "collection_id" = ${input.collectionId}
            AND embedding IS NOT NULL
          `;

          const documentCount = Number(documentCountResult[0]?.count ?? 0);

          // If we have exactly 5 documents (just reached threshold) or multiples of 5,
          // trigger not-not generation
          if (documentCount >= 5 && documentCount % 5 === 0) {
            console.log(
              `Collection ${input.collectionId} has ${documentCount} documents, triggering not-not generation`
            );

            // Check if we need generation using our status endpoint
            const { createCaller } = await import("~/trpc/router/index");
            const caller = createCaller({
              db: ctx.db,
              session: ctx.session,
              headers: new Headers(),
            });

            const status = await caller.notNot.getGenerationStatus({
              collectionId: input.collectionId,
            });

            if (status.generationNeeded) {
              console.log(
                `Starting not-not generation for collection ${input.collectionId}`
              );

              await caller.notNot.generateForCollection({
                collectionId: input.collectionId,
              });

              console.log(
                `Completed not-not generation for collection ${input.collectionId}`
              );
            } else {
              console.log(
                `No new not-not generation needed for collection ${input.collectionId}`
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to trigger not-not generation for collection ${input.collectionId}:`,
            error
          );
          // Don't throw - this is background processing and shouldn't fail document creation
        }
      }, 100); // Small delay to ensure document is fully committed

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

      // Generate embedding if text is being updated
      if (
        filteredUpdateData.text &&
        typeof filteredUpdateData.text === "string" &&
        filteredUpdateData.text.trim() &&
        env.OPENAI_API_KEY
      ) {
        try {
          const embeddingClient = new EmbeddingClient({
            apiKey: env.OPENAI_API_KEY!,
          });
          const embedding = await embeddingClient.generateEmbedding(
            filteredUpdateData.text
          );

          // Update document with embedding using raw SQL
          await ctx.db.$executeRaw`
            UPDATE "Document"
            SET embedding = ${JSON.stringify(embedding)}::vector
            WHERE id = ${id}
          `;
        } catch (error) {
          console.error("Failed to generate embedding:", error);
          // Continue with update even if embedding fails
        }
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

      // Get documents for this collection
      return ctx.db.document.findMany({
        where: { collectionId: input.collectionId },
        orderBy: { createdAt: "desc" },
      });
    }),
});

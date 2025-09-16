import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/trpc";
import { EmbeddingClient } from "~/lib/embedding";
import { env } from "~/env";
import {
  generateNotNotsForDocument,
  type DocumentWithEmbedding,
} from "~/lib/not-not-generator";

/**
 * Helper function to generate NotNots for a document after embedding creation
 */
async function tryGenerateNotNots(
  ctx: any,
  documentId: string,
  documentTitle: string,
  collectionId: string
) {
  try {
    // Get the document with embedding using raw SQL
    const documentWithEmbedding = await ctx.db.$queryRaw<
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
      WHERE id = ${documentId}
      AND embedding IS NOT NULL
    `;

    if (documentWithEmbedding.length === 0) {
      console.log(
        `Document ${documentId} does not have embeddings yet, skipping NotNot generation`
      );
      return;
    }

    const doc = documentWithEmbedding[0]!;

    // Parse embedding from string format
    let parsedEmbedding: number[] = [];
    if (doc.embedding) {
      try {
        const vectorStr = doc.embedding.replace(/[[\]]/g, "").trim();
        parsedEmbedding = vectorStr
          .split(",")
          .map(parseFloat)
          .filter((n: number) => !isNaN(n));
      } catch (error) {
        console.error(`Error parsing embedding for document ${doc.id}:`, error);
        return;
      }
    }

    if (parsedEmbedding.length === 0) {
      console.log(
        `Document ${documentId} has invalid embeddings, skipping NotNot generation`
      );
      return;
    }

    const processedDocument: DocumentWithEmbedding = {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      embedding: parsedEmbedding,
      collectionId: doc.collectionId,
    };

    // Generate NotNots for this document
    const notNotCandidates =
      await generateNotNotsForDocument(processedDocument);

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

          // Generate NotNots for this document now that it has an embedding
          await tryGenerateNotNots(
            ctx,
            document.id,
            document.title,
            input.collectionId
          );
        } catch (error) {
          console.error("Failed to generate embedding:", error);
          // Document is still created successfully even if embedding fails
        }
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

          // Generate NotNots for this document now that it has updated embeddings
          await tryGenerateNotNots(
            ctx,
            id,
            updatedDocument.title,
            updatedDocument.collectionId
          );
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

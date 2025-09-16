/*
  Warnings:

  - You are about to drop the column `clusterMetadata` on the `NotNot` table. All the data in the column will be lost.
  - You are about to drop the `NotNotDocumentLink` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `document_id` to the `NotNot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."NotNotDocumentLink" DROP CONSTRAINT "NotNotDocumentLink_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotNotDocumentLink" DROP CONSTRAINT "NotNotDocumentLink_notNotId_fkey";

-- AlterTable
ALTER TABLE "public"."NotNot" DROP COLUMN "clusterMetadata",
ADD COLUMN     "document_id" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB;

-- DropTable
DROP TABLE "public"."NotNotDocumentLink";

-- CreateIndex
CREATE INDEX "NotNot_document_id_idx" ON "public"."NotNot"("document_id");

-- AddForeignKey
ALTER TABLE "public"."NotNot" ADD CONSTRAINT "NotNot_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

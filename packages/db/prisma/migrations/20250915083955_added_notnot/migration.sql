-- CreateTable
CREATE TABLE "public"."NotNot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "collection_id" TEXT NOT NULL,

    CONSTRAINT "NotNot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotNotDocumentLink" (
    "notNotId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "NotNotDocumentLink_pkey" PRIMARY KEY ("notNotId","documentId")
);

-- CreateIndex
CREATE INDEX "NotNot_collection_id_idx" ON "public"."NotNot"("collection_id");

-- AddForeignKey
ALTER TABLE "public"."NotNotDocumentLink" ADD CONSTRAINT "NotNotDocumentLink_notNotId_fkey" FOREIGN KEY ("notNotId") REFERENCES "public"."NotNot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotNotDocumentLink" ADD CONSTRAINT "NotNotDocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

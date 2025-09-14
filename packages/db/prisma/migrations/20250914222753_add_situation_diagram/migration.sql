-- CreateTable
CREATE TABLE "public"."SituationDiagram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collection_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SituationDiagram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SituationDiagram_collection_id_idx" ON "public"."SituationDiagram"("collection_id");

-- AddForeignKey
ALTER TABLE "public"."SituationDiagram" ADD CONSTRAINT "SituationDiagram_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

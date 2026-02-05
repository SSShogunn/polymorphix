-- CreateTable
CREATE TABLE "thumbnails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "video_id" UUID NOT NULL,
    "object_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "file_size" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thumbnails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique enforces one thumbnail per video)
CREATE UNIQUE INDEX "thumbnails_video_id_key" ON "thumbnails"("video_id");

-- AddForeignKey
ALTER TABLE "thumbnails" ADD CONSTRAINT "thumbnails_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "file_storage" (
    "uuid" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "path" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "origin_file_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,

    CONSTRAINT "file_storage_pkey" PRIMARY KEY ("uuid")
);

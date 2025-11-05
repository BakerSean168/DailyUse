/*
  Warnings:

  - Changed the type of `importance` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `urgency` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable (删除了重复的列定义：actual_minutes, estimated_minutes, completed_at 等已在前一个迁移中添加)
ALTER TABLE "task_templates" 
DROP COLUMN "importance",
ADD COLUMN     "importance" INTEGER NOT NULL,
DROP COLUMN "urgency",
ADD COLUMN     "urgency" INTEGER NOT NULL,
ALTER COLUMN "generate_ahead_days" DROP NOT NULL,
ALTER COLUMN "time_config_type" DROP NOT NULL;

-- CreateTable
CREATE TABLE "documents" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "folder_path" TEXT NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_version" INTEGER NOT NULL DEFAULT 0,
    "last_versioned_at" INTEGER,
    "created_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
    "updated_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
    "deleted_at" INTEGER,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "uuid" TEXT NOT NULL,
    "document_uuid" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "change_description" TEXT,
    "changed_by" TEXT NOT NULL,
    "restored_from" TEXT,
    "metadata" JSONB,
    "created_at" INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "documents_account_uuid_deleted_at_idx" ON "documents"("account_uuid", "deleted_at");

-- CreateIndex
CREATE INDEX "documents_account_uuid_folder_path_idx" ON "documents"("account_uuid", "folder_path");

-- CreateIndex
CREATE INDEX "documents_account_uuid_status_idx" ON "documents"("account_uuid", "status");

-- CreateIndex
CREATE INDEX "document_versions_document_uuid_version_number_idx" ON "document_versions"("document_uuid", "version_number");

-- CreateIndex
CREATE INDEX "document_versions_document_uuid_created_at_idx" ON "document_versions"("document_uuid", "created_at");

-- CreateIndex
CREATE INDEX "document_versions_changed_by_idx" ON "document_versions"("changed_by");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_uuid_fkey" FOREIGN KEY ("document_uuid") REFERENCES "documents"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "accounts"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

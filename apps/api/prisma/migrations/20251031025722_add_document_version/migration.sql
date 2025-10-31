/*
  Warnings:

  - Changed the type of `importance` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `urgency` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "task_templates" ADD COLUMN     "actual_minutes" INTEGER,
ADD COLUMN     "completed_at" BIGINT,
ADD COLUMN     "due_date" BIGINT,
ADD COLUMN     "estimated_minutes" INTEGER,
ADD COLUMN     "goal_uuid" TEXT,
ADD COLUMN     "key_result_uuid" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "parent_task_uuid" TEXT,
ADD COLUMN     "start_date" BIGINT,
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

-- CreateIndex
CREATE INDEX "notifications_account_uuid_idx" ON "notifications"("account_uuid");

-- CreateIndex
CREATE INDEX "task_templates_account_uuid_idx" ON "task_templates"("account_uuid");

-- CreateIndex
CREATE INDEX "task_templates_status_idx" ON "task_templates"("status");

-- CreateIndex
CREATE INDEX "task_templates_importance_idx" ON "task_templates"("importance");

-- CreateIndex
CREATE INDEX "task_templates_urgency_idx" ON "task_templates"("urgency");

-- CreateIndex
CREATE INDEX "task_templates_goal_uuid_idx" ON "task_templates"("goal_uuid");

-- CreateIndex
CREATE INDEX "task_templates_key_result_uuid_idx" ON "task_templates"("key_result_uuid");

-- CreateIndex
CREATE INDEX "task_templates_parent_task_uuid_idx" ON "task_templates"("parent_task_uuid");

-- CreateIndex
CREATE INDEX "task_templates_due_date_idx" ON "task_templates"("due_date");

-- CreateIndex
CREATE INDEX "task_templates_deleted_at_idx" ON "task_templates"("deleted_at");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_uuid_fkey" FOREIGN KEY ("document_uuid") REFERENCES "documents"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "accounts"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_parent_task_uuid_fkey" FOREIGN KEY ("parent_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

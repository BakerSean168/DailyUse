/*
  Warnings:

  - Changed the type of `importance` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `urgency` on the `task_templates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "reminder_templates" ADD COLUMN     "adjusted_interval" INTEGER,
ADD COLUMN     "adjustment_reason" TEXT,
ADD COLUMN     "adjustment_time" BIGINT,
ADD COLUMN     "avg_response_time" INTEGER,
ADD COLUMN     "click_rate" DOUBLE PRECISION,
ADD COLUMN     "effectiveness_score" DOUBLE PRECISION,
ADD COLUMN     "ignore_rate" DOUBLE PRECISION,
ADD COLUMN     "is_auto_adjusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_analysis_time" BIGINT,
ADD COLUMN     "original_interval" INTEGER,
ADD COLUMN     "sample_size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "smart_frequency_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "snooze_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_confirmed" BOOLEAN NOT NULL DEFAULT false;

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
CREATE TABLE "reminder_responses" (
    "uuid" TEXT NOT NULL,
    "template_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "response_time" INTEGER,
    "timestamp" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_responses_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "reminder_responses_template_uuid_timestamp_idx" ON "reminder_responses"("template_uuid", "timestamp" DESC);

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
ALTER TABLE "reminder_responses" ADD CONSTRAINT "reminder_responses_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "reminder_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_goal_uuid_fkey" FOREIGN KEY ("goal_uuid") REFERENCES "goals"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_key_result_uuid_fkey" FOREIGN KEY ("key_result_uuid") REFERENCES "key_results"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_parent_task_uuid_fkey" FOREIGN KEY ("parent_task_uuid") REFERENCES "task_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

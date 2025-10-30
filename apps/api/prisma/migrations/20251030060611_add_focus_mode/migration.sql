/*
  Warnings:

  - You are about to drop the column `settings` on the `editor_workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `notification_channels` on the `reminder_history` table. All the data in the column will be lost.
  - Added the required column `setting` to the `editor_workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."app_configs_is_current_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_group_tabs_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_group_tabs_document_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_group_tabs_group_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_group_tabs_session_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_groups_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_session_groups_session_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_sessions_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."editor_workspace_sessions_is_active_idx";

-- DropIndex
DROP INDEX "public"."editor_workspaces_accessed_at_idx";

-- DropIndex
DROP INDEX "public"."editor_workspaces_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."focus_sessions_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."focus_sessions_account_uuid_status_idx";

-- DropIndex
DROP INDEX "public"."focus_sessions_created_at_idx";

-- DropIndex
DROP INDEX "public"."focus_sessions_goal_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_folders_account_uuid_deleted_at_idx";

-- DropIndex
DROP INDEX "public"."goal_folders_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_folders_account_uuid_sort_order_idx";

-- DropIndex
DROP INDEX "public"."goal_records_key_result_uuid_idx";

-- DropIndex
DROP INDEX "public"."goal_reviews_created_at_idx";

-- DropIndex
DROP INDEX "public"."goals_account_uuid_folder_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_account_uuid_status_idx";

-- DropIndex
DROP INDEX "public"."goals_created_at_idx";

-- DropIndex
DROP INDEX "public"."goals_folder_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_parent_goal_uuid_idx";

-- DropIndex
DROP INDEX "public"."goals_status_idx";

-- DropIndex
DROP INDEX "public"."key_result_weight_snapshots_goal_uuid_idx";

-- DropIndex
DROP INDEX "public"."key_result_weight_snapshots_goal_uuid_snapshot_time_idx";

-- DropIndex
DROP INDEX "public"."key_result_weight_snapshots_key_result_uuid_idx";

-- DropIndex
DROP INDEX "public"."key_results_goal_uuid_created_at_idx";

-- DropIndex
DROP INDEX "public"."linked_contents_content_type_idx";

-- DropIndex
DROP INDEX "public"."linked_contents_resource_uuid_idx";

-- DropIndex
DROP INDEX "public"."notifications_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."notifications_category_idx";

-- DropIndex
DROP INDEX "public"."reminder_instances_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."reminder_instances_status_idx";

-- DropIndex
DROP INDEX "public"."reminder_instances_template_uuid_idx";

-- DropIndex
DROP INDEX "public"."reminder_templates_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."reminder_templates_group_uuid_idx";

-- DropIndex
DROP INDEX "public"."reminder_templates_next_trigger_at_idx";

-- DropIndex
DROP INDEX "public"."repositories_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."repositories_created_at_idx";

-- DropIndex
DROP INDEX "public"."repositories_last_accessed_at_idx";

-- DropIndex
DROP INDEX "public"."repositories_path_idx";

-- DropIndex
DROP INDEX "public"."repositories_status_idx";

-- DropIndex
DROP INDEX "public"."repository_explorers_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."repository_resources_created_at_idx";

-- DropIndex
DROP INDEX "public"."repository_resources_path_idx";

-- DropIndex
DROP INDEX "public"."repository_resources_repository_uuid_idx";

-- DropIndex
DROP INDEX "public"."repository_resources_status_idx";

-- DropIndex
DROP INDEX "public"."resource_references_reference_type_idx";

-- DropIndex
DROP INDEX "public"."resource_references_source_resource_uuid_idx";

-- DropIndex
DROP INDEX "public"."schedule_executions_execution_time_idx";

-- DropIndex
DROP INDEX "public"."schedule_executions_status_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_enabled_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_next_run_at_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_source_entity_id_idx";

-- DropIndex
DROP INDEX "public"."schedule_tasks_source_module_idx";

-- DropIndex
DROP INDEX "public"."schedules_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."schedules_account_uuid_start_time_end_time_idx";

-- DropIndex
DROP INDEX "public"."setting_groups_order_idx";

-- DropIndex
DROP INDEX "public"."setting_items_group_uuid_idx";

-- DropIndex
DROP INDEX "public"."setting_items_order_idx";

-- DropIndex
DROP INDEX "public"."settings_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."settings_created_at_idx";

-- DropIndex
DROP INDEX "public"."settings_device_id_idx";

-- DropIndex
DROP INDEX "public"."settings_group_uuid_idx";

-- DropIndex
DROP INDEX "public"."settings_is_system_setting_idx";

-- DropIndex
DROP INDEX "public"."settings_key_idx";

-- DropIndex
DROP INDEX "public"."task_dependencies_predecessor_task_uuid_idx";

-- DropIndex
DROP INDEX "public"."task_instances_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."task_instances_account_uuid_instance_date_idx";

-- DropIndex
DROP INDEX "public"."task_instances_account_uuid_status_idx";

-- DropIndex
DROP INDEX "public"."task_instances_instance_date_idx";

-- DropIndex
DROP INDEX "public"."task_instances_status_idx";

-- DropIndex
DROP INDEX "public"."task_instances_template_uuid_idx";

-- DropIndex
DROP INDEX "public"."task_templates_account_uuid_deleted_at_idx";

-- DropIndex
DROP INDEX "public"."task_templates_account_uuid_idx";

-- DropIndex
DROP INDEX "public"."task_templates_account_uuid_status_idx";

-- DropIndex
DROP INDEX "public"."task_templates_account_uuid_task_type_idx";

-- DropIndex
DROP INDEX "public"."task_templates_status_idx";

-- AlterTable
ALTER TABLE "editor_workspaces" DROP COLUMN "settings",
ADD COLUMN     "setting" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "reminder_history" DROP COLUMN "notification_channels",
ADD COLUMN     "notificationChannel" TEXT;

-- CreateTable
CREATE TABLE "focus_modes" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "focused_goal_uuids" TEXT[],
    "start_time" BIGINT NOT NULL,
    "end_time" BIGINT NOT NULL,
    "hidden_goals_mode" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "actual_end_time" BIGINT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "focus_modes_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "focus_modes_account_uuid_idx" ON "focus_modes"("account_uuid");

-- CreateIndex
CREATE INDEX "focus_modes_is_active_idx" ON "focus_modes"("is_active");

-- CreateIndex
CREATE INDEX "focus_modes_end_time_idx" ON "focus_modes"("end_time");

-- AddForeignKey
ALTER TABLE "focus_modes" ADD CONSTRAINT "focus_modes_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

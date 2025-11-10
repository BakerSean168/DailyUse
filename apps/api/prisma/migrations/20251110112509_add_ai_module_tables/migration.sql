-- CreateTable: AI Conversations (AI 对话聚合根)
CREATE TABLE "ai_conversations" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable: AI Messages (AI 消息实体)
CREATE TABLE "ai_messages" (
    "uuid" TEXT NOT NULL,
    "conversation_uuid" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "token_usage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable: AI Generation Tasks (AI 生成任务聚合根)
CREATE TABLE "ai_generation_tasks" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "token_usage" TEXT,
    "processing_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_generation_tasks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable: AI Usage Quotas (AI 使用配额聚合根)
CREATE TABLE "ai_usage_quotas" (
    "uuid" TEXT NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "quota_limit" INTEGER NOT NULL DEFAULT 50,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "reset_period" TEXT NOT NULL DEFAULT 'DAILY',
    "last_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_reset_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_usage_quotas_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex: AI Conversations
CREATE INDEX "ai_conversations_account_uuid_idx" ON "ai_conversations"("account_uuid");
CREATE INDEX "ai_conversations_status_idx" ON "ai_conversations"("status");
CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations"("created_at");
CREATE INDEX "ai_conversations_last_message_at_idx" ON "ai_conversations"("last_message_at");

-- CreateIndex: AI Messages
CREATE INDEX "ai_messages_conversation_uuid_idx" ON "ai_messages"("conversation_uuid");
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- CreateIndex: AI Generation Tasks
CREATE INDEX "ai_generation_tasks_account_uuid_idx" ON "ai_generation_tasks"("account_uuid");
CREATE INDEX "ai_generation_tasks_task_type_idx" ON "ai_generation_tasks"("task_type");
CREATE INDEX "ai_generation_tasks_status_idx" ON "ai_generation_tasks"("status");
CREATE INDEX "ai_generation_tasks_created_at_idx" ON "ai_generation_tasks"("created_at");

-- CreateIndex: AI Usage Quotas
CREATE UNIQUE INDEX "ai_usage_quotas_account_uuid_key" ON "ai_usage_quotas"("account_uuid");
CREATE INDEX "ai_usage_quotas_account_uuid_idx" ON "ai_usage_quotas"("account_uuid");
CREATE INDEX "ai_usage_quotas_next_reset_at_idx" ON "ai_usage_quotas"("next_reset_at");

-- AddForeignKey: AI Conversations → Accounts
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_account_uuid_fkey" 
    FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AI Messages → AI Conversations
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_uuid_fkey" 
    FOREIGN KEY ("conversation_uuid") REFERENCES "ai_conversations"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AI Generation Tasks → Accounts
ALTER TABLE "ai_generation_tasks" ADD CONSTRAINT "ai_generation_tasks_account_uuid_fkey" 
    FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AI Usage Quotas → Accounts
ALTER TABLE "ai_usage_quotas" ADD CONSTRAINT "ai_usage_quotas_account_uuid_fkey" 
    FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

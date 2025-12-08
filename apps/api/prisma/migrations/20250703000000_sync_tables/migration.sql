-- EPIC-005: Backend Sync Service
-- STORY-023: Sync Database Migration
-- Creates tables for sync infrastructure

-- CreateTable: sync_events (Event Sourcing core table)
CREATE TABLE "sync_events" (
    "id" BIGSERIAL NOT NULL,
    "event_id" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "device_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "operation" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "base_version" BIGINT NOT NULL,
    "new_version" BIGINT NOT NULL,
    "client_timestamp" BIGINT NOT NULL,
    "server_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: entity_versions (Materialized current state)
CREATE TABLE "entity_versions" (
    "id" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "current_version" BIGINT NOT NULL DEFAULT 1,
    "current_data" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_modified_by" UUID,
    "last_modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sync_devices (Device registration)
CREATE TABLE "sync_devices" (
    "id" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "device_id" UUID NOT NULL,
    "device_name" VARCHAR(100) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "app_version" VARCHAR(20),
    "last_sync_version" BIGINT NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "push_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sync_cursors (Device sync progress)
CREATE TABLE "sync_cursors" (
    "id" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "device_id" UUID NOT NULL,
    "last_synced_event_id" BIGINT NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sync_conflicts (Conflict records)
CREATE TABLE "sync_conflicts" (
    "id" UUID NOT NULL,
    "account_uuid" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "local_event_id" UUID NOT NULL,
    "server_version" BIGINT NOT NULL,
    "local_data" JSONB NOT NULL,
    "server_data" JSONB NOT NULL,
    "conflicting_fields" TEXT[],
    "resolution_strategy" VARCHAR(20),
    "resolved_data" JSONB,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_device" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: sync_events indexes
CREATE UNIQUE INDEX "sync_events_event_id_key" ON "sync_events"("event_id");
CREATE INDEX "sync_events_account_uuid_new_version_idx" ON "sync_events"("account_uuid", "new_version");
CREATE INDEX "sync_events_account_uuid_entity_type_entity_id_idx" ON "sync_events"("account_uuid", "entity_type", "entity_id");
CREATE INDEX "sync_events_device_id_idx" ON "sync_events"("device_id");
CREATE INDEX "sync_events_server_timestamp_idx" ON "sync_events"("server_timestamp");

-- CreateIndex: entity_versions indexes
CREATE UNIQUE INDEX "entity_versions_account_uuid_entity_type_entity_id_key" ON "entity_versions"("account_uuid", "entity_type", "entity_id");
CREATE INDEX "entity_versions_account_uuid_entity_type_idx" ON "entity_versions"("account_uuid", "entity_type");
CREATE INDEX "entity_versions_account_uuid_current_version_idx" ON "entity_versions"("account_uuid", "current_version");
CREATE INDEX "entity_versions_is_deleted_idx" ON "entity_versions"("is_deleted");

-- CreateIndex: sync_devices indexes
CREATE UNIQUE INDEX "sync_devices_device_id_key" ON "sync_devices"("device_id");
CREATE INDEX "sync_devices_account_uuid_idx" ON "sync_devices"("account_uuid");
CREATE INDEX "sync_devices_is_active_idx" ON "sync_devices"("is_active");
CREATE INDEX "sync_devices_last_seen_at_idx" ON "sync_devices"("last_seen_at");

-- CreateIndex: sync_cursors indexes
CREATE UNIQUE INDEX "sync_cursors_account_uuid_device_id_key" ON "sync_cursors"("account_uuid", "device_id");
CREATE INDEX "sync_cursors_device_id_idx" ON "sync_cursors"("device_id");

-- CreateIndex: sync_conflicts indexes
CREATE INDEX "sync_conflicts_account_uuid_idx" ON "sync_conflicts"("account_uuid");
CREATE INDEX "sync_conflicts_account_uuid_entity_type_entity_id_idx" ON "sync_conflicts"("account_uuid", "entity_type", "entity_id");
CREATE INDEX "sync_conflicts_resolved_at_idx" ON "sync_conflicts"("resolved_at");

-- AddForeignKey: sync_devices -> accounts
ALTER TABLE "sync_devices" ADD CONSTRAINT "sync_devices_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: sync_cursors -> sync_devices
ALTER TABLE "sync_cursors" ADD CONSTRAINT "sync_cursors_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "sync_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: sync_conflicts -> accounts
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

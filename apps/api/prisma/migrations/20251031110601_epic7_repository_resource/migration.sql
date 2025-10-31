-- CreateTable: resource (新架构 Epic 7)
-- 注意：保留现有的 repository_resources 表用于兼容性

CREATE TABLE IF NOT EXISTS "resources" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "repository_uuid" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,  -- markdown | image | video | audio | pdf | link | code | other
  "path" TEXT NOT NULL,
  "size" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "author" TEXT,
  "version" TEXT,
  "tags" TEXT NOT NULL DEFAULT '[]',  -- JSON array
  "category" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ARCHIVED | DELETED | DRAFT
  "metadata" TEXT NOT NULL DEFAULT '{}',  -- JSON (包含 content 字段用于 Markdown)
  "created_at" BIGINT NOT NULL,
  "updated_at" BIGINT NOT NULL,
  "modified_at" BIGINT,
  
  CONSTRAINT "resources_repository_uuid_fkey" 
    FOREIGN KEY ("repository_uuid") 
    REFERENCES "repositories"("uuid") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "resources_repository_uuid_idx" ON "resources"("repository_uuid");
CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources"("type");
CREATE INDEX IF NOT EXISTS "resources_status_idx" ON "resources"("status");
CREATE INDEX IF NOT EXISTS "resources_category_idx" ON "resources"("category");
CREATE INDEX IF NOT EXISTS "resources_created_at_idx" ON "resources"("created_at");

-- Note: 保留 repository_resources 表以保持现有功能的兼容性
-- 后续可以通过视图或数据迁移逐步切换

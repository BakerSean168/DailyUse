-- Add edit tracking fields to documents table
ALTER TABLE documents ADD COLUMN last_edited_at INTEGER;
ALTER TABLE documents ADD COLUMN edit_session_id VARCHAR(255);

-- Create document_links table
CREATE TABLE document_links (
  uuid VARCHAR(36) PRIMARY KEY,
  source_document_uuid VARCHAR(36) NOT NULL,
  target_document_uuid VARCHAR(36),
  link_text VARCHAR(200) NOT NULL,
  link_position INTEGER NOT NULL,
  is_broken BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
  updated_at INTEGER NOT NULL DEFAULT extract(epoch from now())::integer,
  
  CONSTRAINT fk_source_document FOREIGN KEY (source_document_uuid)
    REFERENCES documents(uuid) ON DELETE CASCADE,
  CONSTRAINT fk_target_document FOREIGN KEY (target_document_uuid)
    REFERENCES documents(uuid) ON DELETE SET NULL
);

-- Create indexes for document_links
CREATE INDEX idx_document_links_source_document ON document_links(source_document_uuid);
CREATE INDEX idx_document_links_target_document ON document_links(target_document_uuid);
CREATE INDEX idx_document_links_is_broken ON document_links(is_broken);

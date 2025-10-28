-- Add Epic 1 Story 1.1 required fields

-- Add fields to accounts table
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "account_type" VARCHAR(50) DEFAULT 'LOCAL';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(255);
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "email_verification_token" VARCHAR(255);
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP;

-- Add fields to auth_credentials table  
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "hashed_password" VARCHAR(255);
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "salt" VARCHAR(255);
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER DEFAULT 0;
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP;
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMP;
ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "last_failed_login_at" TIMESTAMP;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "idx_accounts_account_type" ON "accounts"("account_type");
CREATE INDEX IF NOT EXISTS "idx_accounts_email_verification_token" ON "accounts"("email_verification_token");
CREATE INDEX IF NOT EXISTS "idx_auth_credentials_locked_until" ON "auth_credentials"("locked_until");

-- Update comments
COMMENT ON COLUMN "accounts"."account_type" IS 'Account type: LOCAL, GOOGLE, GITHUB, etc.';
COMMENT ON COLUMN "accounts"."email_verification_token" IS 'Token for email verification (Phase 1: generated but not sent)';
COMMENT ON COLUMN "auth_credentials"."hashed_password" IS 'bcrypt hashed password (saltRounds=10)';
COMMENT ON COLUMN "auth_credentials"."failed_login_attempts" IS 'Failed login attempt counter for account lockout';
COMMENT ON COLUMN "auth_credentials"."locked_until" IS 'Account locked until this timestamp (5 failures = 15min lock)';

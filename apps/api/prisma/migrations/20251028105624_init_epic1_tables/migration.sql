/*
  Warnings:

  - You are about to drop the column `account_type` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `display_name` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `email_verification_token` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_at` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `failed_login_attempts` on the `auth_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `hashed_password` on the `auth_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `last_failed_login_at` on the `auth_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `locked_until` on the `auth_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `password_changed_at` on the `auth_credentials` table. All the data in the column will be lost.
  - You are about to drop the column `salt` on the `auth_credentials` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."idx_accounts_account_type";

-- DropIndex
DROP INDEX "public"."idx_accounts_email_verification_token";

-- DropIndex
DROP INDEX "public"."idx_auth_credentials_locked_until";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "account_type",
DROP COLUMN "display_name",
DROP COLUMN "email_verification_token",
DROP COLUMN "last_login_at";

-- AlterTable
ALTER TABLE "auth_credentials" DROP COLUMN "failed_login_attempts",
DROP COLUMN "hashed_password",
DROP COLUMN "last_failed_login_at",
DROP COLUMN "locked_until",
DROP COLUMN "password_changed_at",
DROP COLUMN "salt";

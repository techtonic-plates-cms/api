CREATE TYPE "public"."permission_actions" AS ENUM('create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'restore', 'ban', 'unban');--> statement-breakpoint
CREATE TYPE "public"."permission_resources" AS ENUM('users', 'collections', 'entries', 'assets');--> statement-breakpoint
CREATE TYPE "public"."scope_type" AS ENUM('GLOBAL', 'RESOURCE_SPECIFIC', 'FIELD_SPECIFIC');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'BANNED');--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "scope_type" DEFAULT 'GLOBAL' NOT NULL,
	"resource" "permission_resources" NOT NULL,
	"action" "permission_actions" NOT NULL,
	"field_scope" text[],
	"description" varchar(1024),
	"creation_time" timestamp DEFAULT now() NOT NULL,
	"last_edit_time" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1024),
	"creation_time" timestamp DEFAULT now() NOT NULL,
	"last_edit_time" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"creation_time" timestamp DEFAULT now() NOT NULL,
	"last_login_time" timestamp DEFAULT now() NOT NULL,
	"last_edit_time" timestamp DEFAULT now() NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
-- Insert permissions for all resource and action combinations
-- Users permissions
INSERT INTO "permissions" ("scope_type", "resource", "action", "description") VALUES
('GLOBAL', 'users', 'create', 'Create new users'),
('GLOBAL', 'users', 'read', 'Read user information'),
('GLOBAL', 'users', 'update', 'Update user information'),
('GLOBAL', 'users', 'delete', 'Delete users'),
('GLOBAL', 'users', 'ban', 'Ban users'),
('GLOBAL', 'users', 'unban', 'Unban users');
--> statement-breakpoint
-- Collections permissions
INSERT INTO "permissions" ("scope_type", "resource", "action", "description") VALUES
('GLOBAL', 'collections', 'create', 'Create new collections'),
('GLOBAL', 'collections', 'read', 'Read collection information'),
('GLOBAL', 'collections', 'update', 'Update collection information'),
('GLOBAL', 'collections', 'delete', 'Delete collections');
--> statement-breakpoint
-- Entries permissions
INSERT INTO "permissions" ("scope_type", "resource", "action", "description") VALUES
('GLOBAL', 'entries', 'create', 'Create new entries'),
('GLOBAL', 'entries', 'read', 'Read entry information'),
('GLOBAL', 'entries', 'update', 'Update entry information'),
('GLOBAL', 'entries', 'delete', 'Delete entries'),
('GLOBAL', 'entries', 'publish', 'Publish entries'),
('GLOBAL', 'entries', 'unpublish', 'Unpublish entries'),
('GLOBAL', 'entries', 'archive', 'Archive entries'),
('GLOBAL', 'entries', 'restore', 'Restore archived entries');
--> statement-breakpoint
-- Assets permissions
INSERT INTO "permissions" ("scope_type", "resource", "action", "description") VALUES
('GLOBAL', 'assets', 'create', 'Create new assets'),
('GLOBAL', 'assets', 'read', 'Read asset information'),
('GLOBAL', 'assets', 'update', 'Update asset information'),
('GLOBAL', 'assets', 'delete', 'Delete assets'),
('GLOBAL', 'assets', 'publish', 'Publish assets'),
('GLOBAL', 'assets', 'unpublish', 'Unpublish assets'),
('GLOBAL', 'assets', 'archive', 'Archive assets'),
('GLOBAL', 'assets', 'restore', 'Restore archived assets');

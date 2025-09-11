CREATE TYPE "public"."data_types" AS ENUM('text', 'typst_text', 'boolean', 'number', 'date_time', 'relation', 'object', 'text_list', 'number_list', 'asset', 'rich_text', 'json');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'ru');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"path" varchar(1024) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"alt" varchar(500),
	"caption" text
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"color" varchar(7),
	"default_locale" "locale" DEFAULT 'en' NOT NULL,
	"supported_locales" varchar(255)[] DEFAULT '{"en"}' NOT NULL,
	"is_localized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"created_by" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"status" "entry_status" DEFAULT 'DRAFT' NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"default_locale" "locale" DEFAULT 'en' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_assets" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_booleans" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" boolean
);
--> statement-breakpoint
CREATE TABLE "entry_datetimes" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" timestamp
);
--> statement-breakpoint
CREATE TABLE "entry_json_data" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL,
	"value_type" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_numbers" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" integer
);
--> statement-breakpoint
CREATE TABLE "entry_relations" (
	"from_entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"to_entry_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_rich_texts" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"raw" text NOT NULL,
	"rendered" text NOT NULL,
	"format" varchar(20) DEFAULT 'markdown' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_texts" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "entry_typst_texts" (
	"entry_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"raw" text NOT NULL,
	"rendered" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"label" varchar(255),
	"data_type" "data_types" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_unique" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_assets" ADD CONSTRAINT "entry_assets_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_assets" ADD CONSTRAINT "entry_assets_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_assets" ADD CONSTRAINT "entry_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_booleans" ADD CONSTRAINT "entry_booleans_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_booleans" ADD CONSTRAINT "entry_booleans_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_datetimes" ADD CONSTRAINT "entry_datetimes_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_datetimes" ADD CONSTRAINT "entry_datetimes_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_json_data" ADD CONSTRAINT "entry_json_data_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_json_data" ADD CONSTRAINT "entry_json_data_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_numbers" ADD CONSTRAINT "entry_numbers_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_numbers" ADD CONSTRAINT "entry_numbers_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_relations" ADD CONSTRAINT "entry_relations_from_entry_id_entries_id_fk" FOREIGN KEY ("from_entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_relations" ADD CONSTRAINT "entry_relations_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_relations" ADD CONSTRAINT "entry_relations_to_entry_id_entries_id_fk" FOREIGN KEY ("to_entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_rich_texts" ADD CONSTRAINT "entry_rich_texts_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_rich_texts" ADD CONSTRAINT "entry_rich_texts_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_texts" ADD CONSTRAINT "entry_texts_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_texts" ADD CONSTRAINT "entry_texts_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_typst_texts" ADD CONSTRAINT "entry_typst_texts_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "entry_typst_texts" ADD CONSTRAINT "entry_typst_texts_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE cascade;
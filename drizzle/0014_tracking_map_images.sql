ALTER TABLE "tracks" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "captured_at" timestamp;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "image_key" text;--> statement-breakpoint
UPDATE "tracks" SET "latitude" = "x_coordinate"::double precision WHERE "latitude" IS NULL;--> statement-breakpoint
UPDATE "tracks" SET "longitude" = "y_coordinate"::double precision WHERE "longitude" IS NULL;--> statement-breakpoint
UPDATE "tracks" SET "captured_at" = "created_at" WHERE "captured_at" IS NULL;--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "latitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "longitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "captured_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "captured_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" DROP COLUMN "x_coordinate";--> statement-breakpoint
ALTER TABLE "tracks" DROP COLUMN "y_coordinate";

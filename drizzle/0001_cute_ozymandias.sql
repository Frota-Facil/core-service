CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"odometer" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"type" text DEFAULT 'CAR' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);

ALTER TABLE "users" ADD COLUMN "cnh" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cnh_unique" UNIQUE("cnh");
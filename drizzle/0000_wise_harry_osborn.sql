CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"cpf" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'driver' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
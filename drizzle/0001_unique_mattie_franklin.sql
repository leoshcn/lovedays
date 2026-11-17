CREATE TABLE "category_label" (
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_label_user_id_category_pk" PRIMARY KEY("user_id","category")
);
--> statement-breakpoint
ALTER TABLE "category_label" ADD CONSTRAINT "category_label_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
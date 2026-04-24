CREATE TYPE "public"."area" AS ENUM('100Nossao', 'Produtos', 'Eventos', 'Esportes', 'Cultura', 'Marketing');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('Admin', 'Diretor', 'Membro');--> statement-breakpoint
CREATE TYPE "public"."status_task" AS ENUM('Ativa', 'Finalizada');--> statement-breakpoint
CREATE TYPE "public"."status_validation" AS ENUM('Pendente', 'Aprovada', 'Rejeitada');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"nickname" varchar(255) NOT NULL,
	"student_id" varchar(255) NOT NULL,
	"course" varchar(255) NOT NULL,
	"entry_year" varchar(255) NOT NULL,
	"favorite_song" varchar(255),
	"role" "role" DEFAULT 'Membro' NOT NULL,
	"accumulated_aura" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"proof_link" varchar(2048) NOT NULL,
	"validation_status" "status_validation" DEFAULT 'Pendente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"aura_value" integer NOT NULL,
	"origin_area" "area" NOT NULL,
	"max_participants" integer,
	"created_by" uuid NOT NULL,
	"status" "status_task" DEFAULT 'Ativa' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_member_id_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
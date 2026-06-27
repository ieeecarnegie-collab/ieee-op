CREATE TABLE "action_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_note_id" text,
	"committee_id" text NOT NULL,
	"owner_id" text,
	"description" text NOT NULL,
	"due_date" text,
	"status" text DEFAULT 'open' NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "committee_check_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"target_committee_id" text NOT NULL,
	"checked_in_at" text NOT NULL,
	"notes" text,
	"checked_in_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "committee_memberships" (
	"user_id" text NOT NULL,
	"committee_id" text NOT NULL,
	"role_label" text,
	CONSTRAINT "committee_memberships_user_id_committee_id_pk" PRIMARY KEY("user_id","committee_id")
);
--> statement-breakpoint
CREATE TABLE "committees" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tracking_type" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "committees_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" text PRIMARY KEY NOT NULL,
	"committee_id" text NOT NULL,
	"linked_event_id" text,
	"designer_id" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"due_date" text,
	"asset_url" text,
	"caption_summary" text,
	"post_url" text,
	"posted_at" text
);
--> statement-breakpoint
CREATE TABLE "event_checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"offset_days" integer NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL,
	"is_optional" boolean DEFAULT false,
	"is_recommended" boolean DEFAULT false,
	"condition" text DEFAULT 'always' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" text NOT NULL,
	"linked_deliverable_id" text,
	"completed_at" text,
	"completed_by" text
);
--> statement-breakpoint
CREATE TABLE "event_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"committee_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"notes" text,
	"logged_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_planning_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"offset_days" integer NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL,
	"is_optional" boolean DEFAULT false,
	"is_recommended" boolean DEFAULT false,
	"condition" text DEFAULT 'always' NOT NULL,
	"links_to_deliverable" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"committee_id" text NOT NULL,
	"title" text NOT NULL,
	"start_at" text NOT NULL,
	"end_at" text,
	"location" text,
	"description" text,
	"is_signature" boolean DEFAULT false,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"signup_form_url" text,
	"rsvp_count" integer,
	"needs_food" boolean DEFAULT false,
	"needs_food_sponsored" boolean DEFAULT false,
	"needs_food_internal" boolean DEFAULT false,
	"needs_supplies" boolean DEFAULT false,
	"has_external_guests" boolean DEFAULT false,
	"co_host_ids" text DEFAULT '[]',
	"use_planning_checklist" boolean DEFAULT true,
	"deleted_at" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"committee_id" text NOT NULL,
	"title" text NOT NULL,
	"target_metric" text,
	"deadline" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "meeting_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"committee_id" text NOT NULL,
	"author_id" text NOT NULL,
	"meeting_date" text NOT NULL,
	"summary" text,
	"attendee_ids" text DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prez_finance_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"last_updated" text NOT NULL,
	"notes" text,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_event_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"committee_id" text NOT NULL,
	"name" text NOT NULL,
	"typical_timing" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"can_view_all" boolean DEFAULT true,
	"can_edit_all" boolean DEFAULT false,
	"can_manage_users" boolean DEFAULT false,
	"committee_edit_scopes" text DEFAULT '[]' NOT NULL,
	CONSTRAINT "user_permissions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"is_exec_member" boolean DEFAULT true,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_note_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_note_id") REFERENCES "public"."meeting_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_check_ins" ADD CONSTRAINT "committee_check_ins_target_committee_id_committees_id_fk" FOREIGN KEY ("target_committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_check_ins" ADD CONSTRAINT "committee_check_ins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_linked_event_id_events_id_fk" FOREIGN KEY ("linked_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_designer_id_users_id_fk" FOREIGN KEY ("designer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist_items" ADD CONSTRAINT "event_checklist_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist_items" ADD CONSTRAINT "event_checklist_items_linked_deliverable_id_deliverables_id_fk" FOREIGN KEY ("linked_deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist_items" ADD CONSTRAINT "event_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_expenses" ADD CONSTRAINT "event_expenses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_expenses" ADD CONSTRAINT "event_expenses_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_expenses" ADD CONSTRAINT "event_expenses_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prez_finance_snapshots" ADD CONSTRAINT "prez_finance_snapshots_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_event_templates" ADD CONSTRAINT "signature_event_templates_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
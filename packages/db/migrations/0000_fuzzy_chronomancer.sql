CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" bigint NOT NULL,
	"registry_address" text NOT NULL,
	"thesis_id" numeric(20, 0) NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"request_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_idempotency" UNIQUE("author_user_id","request_key"),
	CONSTRAINT "comment_length" CHECK (char_length("comments"."body") BETWEEN 1 AND 280),
	CONSTRAINT "comment_status" CHECK ("comments"."status" IN ('visible','hidden','deleted'))
);
--> statement-breakpoint
CREATE TABLE "execution_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" bigint NOT NULL,
	"registry_address" text NOT NULL,
	"thesis_id" numeric(20, 0) NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"verification_status" text DEFAULT 'attested' NOT NULL,
	"position_state" text DEFAULT 'unknown' NOT NULL,
	"execution_ref" text,
	"fill_identity" text,
	"exchange_address" text,
	"instance_id" integer,
	"account_id" numeric(20, 0),
	"order_id" numeric(20, 0),
	"market_id" integer,
	"transaction_hash" text,
	"log_index" integer,
	"evidence" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "execution_per_thesis" UNIQUE("chain_id","registry_address","thesis_id"),
	CONSTRAINT "execution_reference_format" CHECK ("execution_evidence"."execution_ref" IS NULL OR "execution_evidence"."execution_ref" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "position_state" CHECK ("execution_evidence"."position_state" IN ('unknown','open','closed')),
	CONSTRAINT "verified_evidence_required" CHECK (coalesce(("execution_evidence"."verification_status" = 'attested' AND "execution_evidence"."fill_identity" IS NULL AND "execution_evidence"."exchange_address" IS NULL AND "execution_evidence"."instance_id" IS NULL AND "execution_evidence"."account_id" IS NULL AND "execution_evidence"."order_id" IS NULL AND "execution_evidence"."market_id" IS NULL AND "execution_evidence"."transaction_hash" IS NULL AND "execution_evidence"."log_index" IS NULL AND "execution_evidence"."evidence" IS NULL AND "execution_evidence"."verified_at" IS NULL AND "execution_evidence"."position_state" = 'unknown') OR ("execution_evidence"."verification_status" = 'verified' AND "execution_evidence"."fill_identity" ~ '^0x[0-9a-f]{64}$' AND "execution_evidence"."exchange_address" ~ '^0x[0-9a-f]{40}$' AND "execution_evidence"."instance_id" > 0 AND "execution_evidence"."account_id" BETWEEN 1 AND 18446744073709551615 AND "execution_evidence"."order_id" BETWEEN 1 AND 18446744073709551615 AND "execution_evidence"."market_id" > 0 AND "execution_evidence"."transaction_hash" ~ '^0x[0-9a-f]{64}$' AND "execution_evidence"."log_index" >= 0 AND "execution_evidence"."execution_ref" IS NOT NULL AND "execution_evidence"."evidence" IS NOT NULL AND "execution_evidence"."verified_at" IS NOT NULL), false))
);
--> statement-breakpoint
CREATE TABLE "thesis_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" bigint NOT NULL,
	"registry_address" text NOT NULL,
	"thesis_id" numeric(20, 0),
	"author_user_id" uuid NOT NULL,
	"author_wallet" text NOT NULL,
	"parent_id" numeric(20, 0) NOT NULL,
	"intent" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"reasoning" text NOT NULL,
	"entry_note" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"tx_hash" text,
	"request_key" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metadata_namespace" UNIQUE("chain_id","registry_address","thesis_id"),
	CONSTRAINT "draft_idempotency" UNIQUE("author_user_id","request_key"),
	CONSTRAINT "receipt_once" UNIQUE("chain_id","registry_address","tx_hash"),
	CONSTRAINT "metadata_registry" CHECK ("thesis_metadata"."chain_id" > 0 AND "thesis_metadata"."registry_address" ~ '^0x[0-9a-f]{40}$' AND "thesis_metadata"."registry_address" <> '0x0000000000000000000000000000000000000000'),
	CONSTRAINT "metadata_id_bounds" CHECK (("thesis_metadata"."thesis_id" IS NULL OR "thesis_metadata"."thesis_id" BETWEEN 1 AND 18446744073709551615) AND "thesis_metadata"."parent_id" BETWEEN 0 AND 18446744073709551615),
	CONSTRAINT "metadata_hash" CHECK ("thesis_metadata"."content_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_lengths" CHECK (char_length("thesis_metadata"."reasoning") BETWEEN 10 AND 500 AND ("thesis_metadata"."entry_note" IS NULL OR char_length("thesis_metadata"."entry_note") <= 160) AND cardinality("thesis_metadata"."tags") <= 3),
	CONSTRAINT "metadata_state" CHECK (coalesce(("thesis_metadata"."status" = 'draft' AND "thesis_metadata"."thesis_id" IS NULL AND "thesis_metadata"."tx_hash" IS NULL AND "thesis_metadata"."finalized_at" IS NULL) OR ("thesis_metadata"."status" = 'finalized' AND "thesis_metadata"."thesis_id" IS NOT NULL AND "thesis_metadata"."tx_hash" ~ '^0x[0-9a-f]{64}$' AND "thesis_metadata"."finalized_at" IS NOT NULL), false))
);
--> statement-breakpoint
CREATE TABLE "rate_buckets" (
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_buckets_user_id_action_window_start_pk" PRIMARY KEY("user_id","action","window_start"),
	CONSTRAINT "rate_count_positive" CHECK ("rate_buckets"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"chain_id" bigint NOT NULL,
	"registry_address" text NOT NULL,
	"thesis_id" numeric(20, 0) NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text DEFAULT 'agree' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_chain_id_registry_address_thesis_id_user_id_type_pk" PRIMARY KEY("chain_id","registry_address","thesis_id","user_id","type"),
	CONSTRAINT "reaction_type" CHECK ("reactions"."type" = 'agree')
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" bigint NOT NULL,
	"registry_address" text NOT NULL,
	"thesis_id" numeric(20, 0) NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"request_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_idempotency" UNIQUE("reporter_user_id","request_key"),
	CONSTRAINT "report_once" UNIQUE("chain_id","registry_address","thesis_id","reporter_user_id"),
	CONSTRAINT "report_reason" CHECK ("reports"."reason" IN ('spam','abuse','misinformation','other')),
	CONSTRAINT "report_note" CHECK ("reports"."note" IS NULL OR char_length("reports"."note") <= 280),
	CONSTRAINT "report_status" CHECK ("reports"."status" IN ('open','reviewed','dismissed','actioned'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_did" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text,
	"bio" text,
	"primary_wallet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_did_unique" UNIQUE("privy_did"),
	CONSTRAINT "users_handle_unique" UNIQUE("handle"),
	CONSTRAINT "handle_format" CHECK ("users"."handle" ~ '^[a-z0-9_]{3,24}$'),
	CONSTRAINT "bio_length" CHECK ("users"."bio" IS NULL OR char_length("users"."bio") <= 160)
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"address" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_owner_pair" UNIQUE("user_id","address"),
	CONSTRAINT "wallet_address_format" CHECK ("wallets"."address" ~ '^0x[0-9a-f]{40}$' AND "wallets"."address" <> '0x0000000000000000000000000000000000000000'),
	CONSTRAINT "wallet_kind" CHECK ("wallets"."kind" IN ('embedded', 'external'))
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comment_thesis_fk" FOREIGN KEY ("chain_id","registry_address","thesis_id") REFERENCES "public"."thesis_metadata"("chain_id","registry_address","thesis_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_evidence" ADD CONSTRAINT "execution_evidence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_evidence" ADD CONSTRAINT "execution_thesis_fk" FOREIGN KEY ("chain_id","registry_address","thesis_id") REFERENCES "public"."thesis_metadata"("chain_id","registry_address","thesis_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_evidence" ADD CONSTRAINT "execution_wallet_fk" FOREIGN KEY ("user_id","wallet_address") REFERENCES "public"."wallets"("user_id","address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thesis_metadata" ADD CONSTRAINT "thesis_metadata_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thesis_metadata" ADD CONSTRAINT "metadata_wallet_owner" FOREIGN KEY ("author_user_id","author_wallet") REFERENCES "public"."wallets"("user_id","address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_buckets" ADD CONSTRAINT "rate_buckets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reaction_thesis_fk" FOREIGN KEY ("chain_id","registry_address","thesis_id") REFERENCES "public"."thesis_metadata"("chain_id","registry_address","thesis_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "report_thesis_fk" FOREIGN KEY ("chain_id","registry_address","thesis_id") REFERENCES "public"."thesis_metadata"("chain_id","registry_address","thesis_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_thesis_idx" ON "comments" USING btree ("chain_id","registry_address","thesis_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fill_identity_once" ON "execution_evidence" USING btree ("fill_identity");--> statement-breakpoint
CREATE INDEX "metadata_author_idx" ON "thesis_metadata" USING btree ("author_user_id","created_at");--> statement-breakpoint
CREATE INDEX "metadata_published_idx" ON "thesis_metadata" USING btree ("status","hidden","finalized_at");--> statement-breakpoint
CREATE INDEX "rate_cleanup_idx" ON "rate_buckets" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "reports_open_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "wallet_user_idx" ON "wallets" USING btree ("user_id");
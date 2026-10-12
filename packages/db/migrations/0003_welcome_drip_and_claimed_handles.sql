CREATE TABLE "faucet_drips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet" text NOT NULL,
	"amount_wei" numeric(30, 0) NOT NULL,
	"status" text NOT NULL,
	"reserved_day" text NOT NULL,
	"nonce" bigint,
	"tx_hash" text,
	"raw_transaction" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faucet_drips_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "faucet_drips_wallet_unique" UNIQUE("wallet"),
	CONSTRAINT "faucet_drips_tx_hash_unique" UNIQUE("tx_hash"),
	CONSTRAINT "faucet_status" CHECK ("faucet_drips"."status" IN ('reserved', 'signed', 'sent', 'confirmed', 'failed')),
	CONSTRAINT "faucet_day_format" CHECK ("faucet_drips"."reserved_day" ~ '^\d{4}-\d{2}-\d{2}$'),
	CONSTRAINT "faucet_tx_hash_format" CHECK ("faucet_drips"."tx_hash" IS NULL OR "faucet_drips"."tx_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "faucet_signed_fields" CHECK ("faucet_drips"."status" IN ('reserved', 'failed') OR ("faucet_drips"."tx_hash" IS NOT NULL AND "faucet_drips"."raw_transaction" IS NOT NULL AND "faucet_drips"."nonce" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "initial_handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "handle_claimed_at" timestamp with time zone;--> statement-breakpoint
-- Hand-written backfill: a handle that is not of the generated form was already chosen.
UPDATE "users" SET "handle_claimed_at" = "updated_at" WHERE "handle" !~ '^u_[0-9a-f]{12}$';--> statement-breakpoint
ALTER TABLE "faucet_drips" ADD CONSTRAINT "faucet_drips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faucet_drips" ADD CONSTRAINT "faucet_drips_wallet_wallets_address_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faucet_day_idx" ON "faucet_drips" USING btree ("reserved_day");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_initial_handle_unique" UNIQUE("initial_handle");
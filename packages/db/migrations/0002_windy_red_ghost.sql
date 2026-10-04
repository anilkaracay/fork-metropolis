CREATE TABLE "wallet_context_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"value" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"lease_id" uuid,
	"lease_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallet_context_cache" ADD CONSTRAINT "wallet_context_cache_wallet_address_wallets_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."wallets"("address") ON DELETE no action ON UPDATE no action;
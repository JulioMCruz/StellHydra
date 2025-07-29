CREATE TABLE "dex_prices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dex_name" text NOT NULL,
	"from_token" text NOT NULL,
	"to_token" text NOT NULL,
	"rate" numeric(36, 18) NOT NULL,
	"liquidity" numeric(36, 18),
	"fee" numeric(10, 6),
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"from_network" text NOT NULL,
	"to_network" text NOT NULL,
	"from_token" text NOT NULL,
	"to_token" text NOT NULL,
	"from_amount" numeric(36, 18) NOT NULL,
	"to_amount" numeric(36, 18),
	"status" text DEFAULT 'pending' NOT NULL,
	"tx_hash_from" text,
	"tx_hash_to" text,
	"dex_source" text,
	"fee" numeric(36, 18),
	"estimated_time" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"network" text NOT NULL,
	"balances" jsonb DEFAULT '{}'::jsonb,
	"is_connected" boolean DEFAULT false,
	"last_synced" timestamp DEFAULT now(),
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);

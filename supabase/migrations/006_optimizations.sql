-- Migration 006: Performance & Reliability Optimizations
-- Adds blur_data_url for instant image placeholders and idempotency_keys table

-- 1. Add blur_data_url column to procedures for blurDataURL support
ALTER TABLE public.procedures
ADD COLUMN IF NOT EXISTS blur_data_url TEXT;

-- 2. Add blur_data_url column to equipment_items for blurDataURL support
ALTER TABLE public.equipment_items
ADD COLUMN IF NOT EXISTS blur_data_url TEXT;

-- 3. Idempotency Keys table to prevent duplicate mutations on network retries / double-clicks
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_idempotency_key_user_action UNIQUE (key, user_id, action)
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON public.idempotency_keys(key, user_id, action);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at 
ON public.idempotency_keys(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can select and insert idempotency records
CREATE POLICY "Admins can manage their idempotency records"
ON public.idempotency_keys
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy: Service role has full access
CREATE POLICY "Service role full access on idempotency_keys"
ON public.idempotency_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

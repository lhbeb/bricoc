-- Add webhook_secret column to payment_settings
ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

COMMENT ON COLUMN public.payment_settings.webhook_secret
IS 'Stripe webhook signing secret used server-side to verify incoming Stripe webhook signatures.';

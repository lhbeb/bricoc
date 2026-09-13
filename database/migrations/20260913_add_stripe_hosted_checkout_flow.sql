-- Allow Bricoc products to use either Stripe checkout implementation.
-- `stripe` keeps the existing embedded checkout.
-- `stripe-hosted` redirects customers to checkout.stripe.com.

BEGIN;

DO $$
DECLARE
    constraint_record record;
BEGIN
    -- Drop any CHECK constraint that validates checkout_flow, regardless of its
    -- current name. Older Bricoc migrations used different constraint sets.
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'products'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%checkout_flow%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.products DROP CONSTRAINT %I',
            constraint_record.conname
        );
    END LOOP;
END $$;

ALTER TABLE public.products
    ADD CONSTRAINT products_checkout_flow_check
    CHECK (
        checkout_flow IS NULL OR checkout_flow IN (
            'buymeacoffee',
            'kofi',
            'external',
            'stripe',
            'stripe-hosted',
            'paypal-invoice',
            'paypal-unclaimed',
            'paypal-direct',
            'paypal-api',
            'lemon-squeezy'
        )
    );

COMMIT;

-- Optional bulk switch after the migration succeeds:
-- UPDATE public.products
-- SET checkout_flow = 'stripe-hosted'
-- WHERE checkout_flow = 'stripe';

-- Verify the values and product counts:
SELECT checkout_flow, COUNT(*) AS product_count
FROM public.products
GROUP BY checkout_flow
ORDER BY checkout_flow;

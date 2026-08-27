-- Atomic checkout link rotation.
-- Run this in Supabase before relying on high-concurrency checkout link rotation.

CREATE TABLE IF NOT EXISTS checkout_link_rotation_counters (
  product_slug TEXT PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  next_index BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION claim_checkout_link_rotation_index(p_product_slug TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_index BIGINT;
BEGIN
  INSERT INTO checkout_link_rotation_counters (product_slug, next_index, updated_at)
  VALUES (p_product_slug, 1, NOW())
  ON CONFLICT (product_slug)
  DO UPDATE SET
    next_index = checkout_link_rotation_counters.next_index + 1,
    updated_at = NOW()
  RETURNING next_index - 1 INTO claimed_index;

  RETURN claimed_index;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_checkout_link_rotation_index(TEXT) TO service_role;

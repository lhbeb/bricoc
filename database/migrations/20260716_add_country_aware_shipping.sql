-- Preserve complete international delivery addresses as first-class order fields.
-- The checkout API also stores these values in full_order_data for compatibility.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country_code TEXT;

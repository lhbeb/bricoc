-- ============================================
-- Cokaro - COMPLETE DATABASE MIGRATION
-- ============================================
-- Generated from all individual migration files
-- Safe to run multiple times (idempotent)
-- ============================================

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  images TEXT[] NOT NULL,
  condition TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  payee_email TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  checkout_link TEXT NOT NULL,
  checkout_flow TEXT DEFAULT 'buymeacoffee',
  reviews JSONB DEFAULT '[]'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT FALSE,
  listed_by VARCHAR(50) DEFAULT NULL,
  collections TEXT[] DEFAULT '{}',
  seller_id UUID,
  original_price DECIMAL(10, 2),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_checkout_flow ON products(checkout_flow);
CREATE INDEX IF NOT EXISTS idx_products_collections ON products USING GIN (collections);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

-- ============================================
-- 2. ORDERS TABLE
-- ============================================

-- Order number sequence (must be created before orders table)
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 9011;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_address_line_2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT,
  shipping_country_code TEXT,
  full_order_data JSONB NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,
  email_retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  checkout_flow TEXT,
  status TEXT DEFAULT 'pending_payment',
  payment_provider TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_last_error TEXT,
  checkout_expires_at TIMESTAMP WITH TIME ZONE,
  is_converted BOOLEAN DEFAULT FALSE,
  seller_payee_email TEXT,
  payout_status TEXT DEFAULT 'pending',
  payout_sent_at TIMESTAMPTZ,
  payout_batch_id TEXT,
  order_number INTEGER DEFAULT nextval('orders_order_number_seq'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint on stripe_checkout_session_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_stripe_checkout_session_id_key') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);
  END IF;
END $$;

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email_sent ON orders(email_sent);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_product_slug ON orders(product_slug);
CREATE INDEX IF NOT EXISTS idx_orders_next_retry_at ON orders(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_is_converted ON orders(is_converted);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_flow_payout ON orders(checkout_flow, payout_status);

-- ============================================
-- 3. SELLERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  member_since TEXT,
  reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add seller_id foreign key to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

-- Seller indexes
CREATE INDEX IF NOT EXISTS sellers_username_idx ON sellers (username);

-- ============================================
-- 4. ADMIN RBAC SYSTEM
-- ============================================

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('REGULAR_ADMIN', 'SUPER_ADMIN')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_roles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  description TEXT,
  required_role TEXT NOT NULL CHECK (required_role IN ('REGULAR_ADMIN', 'SUPER_ADMIN')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'DENIED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_active ON admin_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_required_role ON admin_permissions(required_role);

-- Insert default permissions
INSERT INTO admin_permissions (permission_key, permission_name, description, required_role, category) VALUES
  ('products.view', 'View Products', 'View product listings', 'REGULAR_ADMIN', 'products'),
  ('products.create', 'Create Products', 'Create new products', 'REGULAR_ADMIN', 'products'),
  ('products.edit', 'Edit Products', 'Edit existing products', 'REGULAR_ADMIN', 'products'),
  ('products.delete', 'Delete Products', 'Delete products (soft delete)', 'SUPER_ADMIN', 'products'),
  ('products.publish', 'Publish Products', 'Publish/unpublish products', 'REGULAR_ADMIN', 'products'),
  ('orders.view', 'View Orders', 'View order listings', 'REGULAR_ADMIN', 'orders'),
  ('orders.edit', 'Edit Orders', 'Edit order details', 'REGULAR_ADMIN', 'orders'),
  ('orders.cancel', 'Cancel Orders', 'Cancel orders', 'REGULAR_ADMIN', 'orders'),
  ('orders.refund', 'Refund Orders', 'Process refunds', 'SUPER_ADMIN', 'orders'),
  ('orders.delete', 'Delete Orders', 'Permanently delete orders', 'SUPER_ADMIN', 'orders'),
  ('users.view', 'View Users', 'View user listings', 'SUPER_ADMIN', 'users'),
  ('users.edit', 'Edit Users', 'Edit user details', 'SUPER_ADMIN', 'users'),
  ('users.delete', 'Delete Users', 'Delete user accounts', 'SUPER_ADMIN', 'users'),
  ('users.ban', 'Ban Users', 'Ban/unban users', 'SUPER_ADMIN', 'users'),
  ('admins.view', 'View Admins', 'View admin listings', 'SUPER_ADMIN', 'admins'),
  ('admins.create', 'Create Admins', 'Create new admin accounts', 'SUPER_ADMIN', 'admins'),
  ('admins.edit', 'Edit Admins', 'Edit admin details', 'SUPER_ADMIN', 'admins'),
  ('admins.delete', 'Delete Admins', 'Delete admin accounts', 'SUPER_ADMIN', 'admins'),
  ('admins.change_role', 'Change Admin Roles', 'Promote/demote admins', 'SUPER_ADMIN', 'admins'),
  ('settings.view', 'View Settings', 'View system settings', 'SUPER_ADMIN', 'settings'),
  ('settings.edit', 'Edit Settings', 'Edit system settings', 'SUPER_ADMIN', 'settings'),
  ('settings.email', 'Email Settings', 'Configure email settings', 'SUPER_ADMIN', 'settings'),
  ('settings.payment', 'Payment Settings', 'Configure payment settings', 'SUPER_ADMIN', 'settings'),
  ('analytics.view', 'View Analytics', 'View analytics dashboard', 'REGULAR_ADMIN', 'analytics'),
  ('analytics.export', 'Export Analytics', 'Export analytics data', 'REGULAR_ADMIN', 'analytics'),
  ('reports.view', 'View Reports', 'View reports', 'REGULAR_ADMIN', 'reports'),
  ('reports.export', 'Export Reports', 'Export reports', 'SUPER_ADMIN', 'reports'),
  ('audit.view', 'View Audit Logs', 'View system audit logs', 'SUPER_ADMIN', 'audit'),
  ('audit.export', 'Export Audit Logs', 'Export audit logs', 'SUPER_ADMIN', 'audit'),
  ('database.backup', 'Database Backup', 'Create database backups', 'SUPER_ADMIN', 'database'),
  ('database.restore', 'Database Restore', 'Restore database from backup', 'SUPER_ADMIN', 'database'),
  ('database.export', 'Export Data', 'Export database data', 'SUPER_ADMIN', 'database')
ON CONFLICT (permission_key) DO NOTHING;

-- Insert default admin users (replace password hashes with real bcrypt hashes)
INSERT INTO admin_roles (email, role, password_hash, is_active, metadata) VALUES
  ('elmahboubimehdi@gmail.com', 'REGULAR_ADMIN', '$2b$10$placeholder_hash_for_regular_admin', TRUE, '{"display_name": "Regular Admin", "department": "Operations"}'::jsonb),
  ('Matrix01mehdi@gmail.com', 'SUPER_ADMIN', '$2b$10$placeholder_hash_for_super_admin', TRUE, '{"display_name": "Super Admin", "department": "System Administration"}'::jsonb)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();

-- ============================================
-- 5. ERROR LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL DEFAULT 'client',
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  route TEXT,
  context TEXT,
  user_agent TEXT,
  extra JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_note TEXT
);

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_resolved_idx ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS error_logs_type_idx ON error_logs(type);

-- ============================================
-- 6. PAYMENT SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
  publishable_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  mode VARCHAR(20) NOT NULL DEFAULT 'live',
  payee_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Payment settings unique constraint
DROP INDEX IF EXISTS unique_active_stripe;
ALTER TABLE public.payment_settings DROP CONSTRAINT IF EXISTS payment_settings_provider_unique;
ALTER TABLE public.payment_settings ADD CONSTRAINT payment_settings_provider_unique UNIQUE (provider);

-- ============================================
-- 7. CHECKOUT LINK ROTATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS checkout_link_rotation_counters (
  product_slug TEXT PRIMARY KEY REFERENCES products(slug) ON DELETE CASCADE,
  next_index BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. CHECKOUT FLOW CONSTRAINT
-- ============================================

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_checkout_flow_check;
ALTER TABLE products ADD CONSTRAINT products_checkout_flow_check CHECK (
  checkout_flow IN (
    'buymeacoffee', 'kofi', 'external', 'stripe',
    'paypal-invoice', 'paypal-unclaimed', 'paypal-direct', 'paypal-api',
    'lemon-squeezy'
  )
);

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON products;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for service_role" ON products;
CREATE POLICY "Enable all access for service_role" ON products
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert access for orders" ON orders;
CREATE POLICY "Public insert access for orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read access for orders" ON orders;
CREATE POLICY "Admin read access for orders" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all updates for service role" ON orders;
CREATE POLICY "Allow all updates for service role" ON orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all deletes for service role" ON orders;
CREATE POLICY "Allow all deletes for service role" ON orders FOR DELETE USING (true);

-- Sellers RLS
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on sellers" ON sellers;
CREATE POLICY "Allow public read on sellers" ON sellers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on sellers" ON sellers;
CREATE POLICY "Allow service role all on sellers" ON sellers FOR ALL USING (true) WITH CHECK (true);

-- Error logs RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert error logs" ON error_logs;
CREATE POLICY "Anyone can insert error logs" ON error_logs FOR INSERT WITH CHECK (true);

-- Payment settings RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on payment_settings" ON public.payment_settings;
CREATE POLICY "Service role full access on payment_settings" ON public.payment_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Deny all public access on payment_settings" ON public.payment_settings;
CREATE POLICY "Deny all public access on payment_settings" ON public.payment_settings
  FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all authenticated access on payment_settings" ON public.payment_settings;
CREATE POLICY "Deny all authenticated access on payment_settings" ON public.payment_settings
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_roles TO authenticated;
GRANT SELECT ON admin_permissions TO authenticated;
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;

-- ============================================
-- 10. STORAGE SETUP
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

-- Storage read policy
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Storage upload policies
DROP POLICY IF EXISTS "Service role uploads for product images" ON storage.objects;
CREATE POLICY "Service role uploads for product images"
  ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Service role updates for product images" ON storage.objects;
CREATE POLICY "Service role updates for product images"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated uploads for product images" ON storage.objects;
CREATE POLICY "Authenticated uploads for product images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated updates for product images" ON storage.objects;
CREATE POLICY "Authenticated updates for product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated deletes for product images" ON storage.objects;
CREATE POLICY "Authenticated deletes for product images"
  ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Update storage bucket MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
WHERE id = 'product-images';

-- ============================================
-- 11. FUNCTIONS AND TRIGGERS
-- ============================================

-- Product updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Product updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_products_updated_at' AND tgrelid = 'products'::regclass
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Orders updated_at trigger function
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Orders updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_orders_updated_at' AND tgrelid = 'orders'::regclass
  ) THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();
  END IF;
END $$;

-- Admin updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_updated_at ON admin_roles;
CREATE TRIGGER trigger_update_admin_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- Payment settings updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_settings_updated_at ON public.payment_settings;
CREATE TRIGGER trg_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_payment_settings_updated_at();

-- Published status sync trigger
CREATE OR REPLACE FUNCTION sync_published_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.published IS DISTINCT FROM NEW.published) THEN
    NEW.meta = COALESCE(NEW.meta, '{}'::jsonb) || jsonb_build_object('published', NEW.published);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_published_trigger ON products;
CREATE TRIGGER sync_published_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION sync_published_status();

-- Checkout link rotation function
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

-- Admin action log function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_email TEXT,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'SUCCESS'
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM admin_roles WHERE email = p_admin_email;
  INSERT INTO admin_audit_log (admin_id, admin_email, action, resource_type, resource_id, details, ip_address, user_agent, status)
  VALUES (v_admin_id, p_admin_email, p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent, p_status)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Admin permission check function
CREATE OR REPLACE FUNCTION check_admin_permission(p_admin_email TEXT, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role TEXT;
  v_required_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM admin_roles WHERE email = p_admin_email AND is_active = TRUE;
  IF v_admin_role IS NULL THEN RETURN FALSE; END IF;

  SELECT required_role INTO v_required_role FROM admin_permissions WHERE permission_key = p_permission_key;
  IF v_required_role IS NULL THEN RETURN FALSE; END IF;

  IF v_admin_role = 'SUPER_ADMIN' THEN RETURN TRUE; END IF;
  IF v_admin_role = 'REGULAR_ADMIN' AND v_required_role = 'REGULAR_ADMIN' THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. DATA MIGRATIONS
-- ============================================

-- Update condition strings
UPDATE products SET condition = '🟢 New / Brand New' WHERE condition = 'New';
UPDATE products SET condition = '🟢 Mint / Like New' WHERE condition = 'Like New';
UPDATE products SET condition = '🟢 Excellent' WHERE condition = 'Excellent';
UPDATE products SET condition = '🟡 Good' WHERE condition = 'Good';
UPDATE products SET condition = '🟠 Fair' WHERE condition = 'Fair';

-- Update any NULL checkout_flow values
UPDATE products SET checkout_flow = 'buymeacoffee' WHERE checkout_flow IS NULL;
UPDATE products SET in_stock = true WHERE in_stock IS NULL;

-- Sync published column from meta
UPDATE products SET published = COALESCE((meta->>'published')::boolean, false) WHERE published IS NULL OR published = false;

-- Update paypal-unclaimed to paypal-direct
UPDATE products SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';
UPDATE orders SET checkout_flow = 'paypal-direct' WHERE checkout_flow = 'paypal-unclaimed';

-- Set payee_email from publishable_key for paypal-unclaimed
UPDATE public.payment_settings
SET payee_email = publishable_key
WHERE provider = 'paypal-unclaimed'
  AND (payee_email IS NULL OR payee_email = '')
  AND publishable_key IS NOT NULL
  AND publishable_key <> '';

-- ============================================
-- 13. COMMENTS
-- ============================================

COMMENT ON COLUMN products.collections IS 'Array of collection tags (e.g., electronics, entertainment, hobbies-collectibles, featured)';
COMMENT ON COLUMN products.listed_by IS 'The user who listed this product';
COMMENT ON TABLE admin_roles IS 'Stores admin user accounts with role-based access control';
COMMENT ON TABLE admin_permissions IS 'Defines available permissions and their required roles';
COMMENT ON TABLE admin_audit_log IS 'Tracks all admin actions for security and compliance';
COMMENT ON FUNCTION check_admin_permission IS 'Checks if an admin has permission to perform an action';
COMMENT ON FUNCTION log_admin_action IS 'Logs an admin action to the audit trail';

-- ============================================
-- DONE
-- ============================================
SELECT '✅ Complete migration finished successfully!' AS status;

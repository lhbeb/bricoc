-- Bricoc: give both owner admin accounts the same full dashboard access.
-- Safe to run repeatedly. Existing passwords are preserved.

UPDATE public.admin_roles
SET
  role = 'SUPER_ADMIN',
  is_active = TRUE,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'display_name', 'Super Admin',
    'department', 'System Administration'
  ),
  updated_at = NOW()
WHERE LOWER(email) IN (
  'matrix01mehdi@gmail.com',
  'elmahboubimehdi@gmail.com'
);

SELECT email, role, is_active
FROM public.admin_roles
WHERE LOWER(email) IN (
  'matrix01mehdi@gmail.com',
  'elmahboubimehdi@gmail.com'
)
ORDER BY LOWER(email);

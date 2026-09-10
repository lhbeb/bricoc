const REVOKED_ADMIN_EMAILS = new Set([
  'amine@bricoc.com',
]);

export function isRevokedAdminEmail(email: string | null | undefined): boolean {
  return REVOKED_ADMIN_EMAILS.has((email || '').toLowerCase().trim());
}

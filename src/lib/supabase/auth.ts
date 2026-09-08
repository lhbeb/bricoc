import { supabaseAdmin } from './server';

export const runtime = 'nodejs';

/**
 * Check if authentication should be bypassed in development
 * Set DISABLE_AUTH_IN_DEV=true in .env.local to bypass authentication
 */
export function shouldBypassAuth(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const disableAuth = process.env.DISABLE_AUTH_IN_DEV;
  const authDebug = process.env.AUTH_DEBUG === 'true';
  
  if (authDebug) {
    console.log('🔍 [AUTH DEBUG] Environment check:', {
      NODE_ENV: nodeEnv,
      DISABLE_AUTH_IN_DEV: disableAuth,
      type: typeof disableAuth,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('AUTH') || k.includes('DISABLE'))
    });
  }
  
  // Only bypass in non-production environments
  if (nodeEnv === 'production') {
    if (authDebug) console.log('🔒 [AUTH] Production mode - authentication required');
    return false;
  }
  
  // Check explicit environment variable
  if (disableAuth === 'true' || disableAuth === '1') {
    console.log('🔓 [AUTH] ✅ Authentication bypassed for local development');
    return true;
  }
  
  if (authDebug) {
    console.log('🔒 [AUTH] Authentication NOT bypassed - DISABLE_AUTH_IN_DEV is:', disableAuth);
  }
  return false;
}

/**
 * Get admin emails from environment variable
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  const list = adminEmailsEnv
    ? adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
    : ['elmahboubimehdi@gmail.com'];

  // Ensure hardcoded admin emails are always recognized
  if (!list.includes('amine@bricoc.com')) {
    list.push('amine@bricoc.com');
  }
  if (!list.includes('matrix01mehdi@gmail.com')) {
    list.push('matrix01mehdi@gmail.com');
  }
  if (!list.includes('elmahboubimehdi@gmail.com')) {
    list.push('elmahboubimehdi@gmail.com');
  }

  return list;
}

/**
 * Check if a user is an admin by email
 */
export async function isAdmin(email: string): Promise<boolean> {
  // Bypass admin check in development if auth is disabled
  if (shouldBypassAuth()) {
    return true;
  }
  
  try {
    const adminEmails = getAdminEmails();
    return adminEmails.includes(email.toLowerCase().trim());
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Authenticate admin user
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed' };
    }

    // Check if user is admin
    const adminStatus = await isAdmin(data.user.email || '');
    if (!adminStatus) {
      return { success: false, error: 'Access denied. Admin access required.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

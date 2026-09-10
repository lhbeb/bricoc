import { NextRequest, NextResponse } from 'next/server';
import { getOrdersCount } from '@/lib/supabase/orders';
import { jwtVerify } from 'jose';
import { isRevokedAdminEmail } from '@/lib/admin-access';

// GET - Return only the total order count (bypasses 1000-row PostgREST limit)
export async function GET(request: NextRequest) {
  try {
    // Basic auth check via Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
      request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      );
      const { payload } = await jwtVerify(token, secret);
      if (payload.isActive !== true || isRevokedAdminEmail(payload.email as string | undefined)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getOrdersCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching orders count:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders count' }, { status: 500 });
  }
}

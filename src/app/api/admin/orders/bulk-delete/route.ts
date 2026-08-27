import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'An array of order IDs is required' },
        { status: 400 }
      );
    }

    // Delete orders from database
    const { error, count } = await supabaseAdmin
      .from('orders')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error bulk deleting orders:', error);
      return NextResponse.json(
        { error: 'Failed to delete selected orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: ids.length,
      message: `Successfully deleted ${ids.length} order(s)`,
    });
  } catch (error) {
    console.error('Error in bulk delete orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

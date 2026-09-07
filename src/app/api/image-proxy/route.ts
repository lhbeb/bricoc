import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }
  
  try {
    // Only proxy images from our allowed Supabase storage
    if (!url.includes('.supabase.co/storage/')) {
      return new NextResponse('Unauthorized URL', { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Deliberately omitting x-robots-tag to allow Googlebot to index the image
      }
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Error proxying image', { status: 500 });
  }
}

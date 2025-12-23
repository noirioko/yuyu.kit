import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

interface SaleItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
  salePrice?: string;
  originalPrice?: string;
  discount?: string;
  scrapedAt?: string;
}

interface SaveSalesRequest {
  userId: string;
  items: SaleItem[];
  lastUpdated: string;
}

export async function POST(request: Request) {
  try {
    const body: SaveSalesRequest = await request.json();
    const { userId, items, lastUpdated } = body;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Validate required fields
    if (!userId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId and items array' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate userId format (should be a Firebase UID)
    if (userId.length < 10 || userId.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const db = getAdminDb();

    // Save sales data to Firestore
    await db.collection('sales').doc(userId).set({
      items: items.map(item => ({
        title: item.title || '',
        url: item.url || '',
        thumbnailUrl: item.thumbnailUrl || '',
        salePrice: item.salePrice || '',
        originalPrice: item.originalPrice || '',
        discount: item.discount || '',
        scrapedAt: item.scrapedAt || new Date().toISOString(),
      })),
      lastUpdated: lastUpdated || new Date().toISOString(),
      itemCount: items.length,
    });

    console.log(`Saved ${items.length} sale items for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${items.length} sale items`,
      itemCount: items.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error saving sales data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save sales data' },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }}
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

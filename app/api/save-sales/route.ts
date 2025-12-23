import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: Request) {
  try {
    const body: SaveSalesRequest = await request.json();
    const { userId, items, lastUpdated } = body;

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

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Save sales data to Firestore using client SDK
    await setDoc(doc(db, 'sales', userId), {
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
      { status: 500, headers: corsHeaders }
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

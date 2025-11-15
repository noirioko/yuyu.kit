import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, url } = body;

    console.log('🔍 Checking for duplicate:', { userId, url });

    if (!userId || !url) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId or url'
      }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    // Check if asset with this URL already exists for this user
    const assetsQuery = query(
      collection(db, 'assets'),
      where('userId', '==', userId),
      where('url', '==', url)
    );

    const assetsSnapshot = await getDocs(assetsQuery);
    const isDuplicate = !assetsSnapshot.empty;

    if (isDuplicate) {
      const existingAsset = assetsSnapshot.docs[0].data();
      console.log('⚠️ Duplicate found:', existingAsset.title);

      return NextResponse.json({
        success: true,
        isDuplicate: true,
        existingAsset: {
          title: existingAsset.title,
          status: existingAsset.status,
          platform: existingAsset.platform
        }
      });
    }

    console.log('✅ No duplicate found');
    return NextResponse.json({
      success: true,
      isDuplicate: false
    });

  } catch (error: any) {
    console.error('❌ Error checking duplicate:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check duplicate'
    }, { status: 500 });
  }
}

// Handle CORS for extension
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

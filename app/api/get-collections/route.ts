import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📥 Fetching collections for user:', userId);

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Fetch all collections for this user
    const collectionsQuery = query(
      collection(db, 'collections'),
      where('userId', '==', userId)
    );

    const collectionsSnapshot = await getDocs(collectionsQuery);
    const collections = collectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      icon: doc.data().icon || '📚',
      color: doc.data().color,
      assetCount: doc.data().assetCount || 0
    }));

    console.log(`✅ Found ${collections.length} collections`);

    return NextResponse.json({
      success: true,
      collections: collections
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching collections:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch collections'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// Handle CORS for extension
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

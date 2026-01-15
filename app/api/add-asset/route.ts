import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc, increment, query, where, getDocs, getDoc } from 'firebase/firestore';

// Free tier limits
const FREE_LIMITS = {
  maxAssets: 50,
  maxProjects: 3,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, url, title, thumbnailUrl, price, originalPrice, isOnSale, currency, platform, creator, description, status, projectId, collectionId } = body;

    console.log('📥 Received asset from extension:', { userId, title, platform, creator, status, projectId, collectionId, isOnSale });

    // Validate required fields
    if (!userId || !url || !title) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, url, or title'
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Check subscription status and limits
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const isPremium = userData.subscription === 'premium';

    if (!isPremium) {
      // Count user's current assets
      const assetsQuery = query(collection(db, 'assets'), where('userId', '==', userId));
      const assetsSnap = await getDocs(assetsQuery);
      const currentAssetCount = assetsSnap.size;

      if (currentAssetCount >= FREE_LIMITS.maxAssets) {
        return NextResponse.json({
          success: false,
          error: `Asset limit reached! Free accounts can save up to ${FREE_LIMITS.maxAssets} assets. Upgrade to Premium for unlimited assets.`,
          limitReached: true,
        }, {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
    }

    const now = Timestamp.now();
    const priceValue = price != null ? parseFloat(price) : null;

    // Parse original price
    const originalPriceValue = originalPrice != null ? parseFloat(originalPrice) : null;

    // Auto-generate tags from platform and creator
    const autoTags: string[] = [];
    if (platform) autoTags.push(platform);
    if (creator) autoTags.push(creator);

    // Add asset to Firestore
    const docRef = await addDoc(collection(db, 'assets'), {
      userId,
      url,
      title,
      description: description || '',
      thumbnailUrl: thumbnailUrl || null,
      currentPrice: priceValue,
      originalPrice: originalPriceValue,
      isOnSale: isOnSale || false,
      currency: currency || '$',
      platform: platform || '',
      creator: creator || '',
      fileLocation: null,
      projectId: projectId || null,
      collectionId: collectionId || null,
      status: (status || 'wishlist') as 'wishlist' | 'bought' | 'in-use',
      tags: autoTags,
      priceHistory: priceValue ? [{
        price: priceValue,
        currency: currency || '$',
        checkedAt: now.toDate()
      }] : [],
      lowestPrice: priceValue,
      lastPriceCheck: priceValue ? now : null,
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Asset saved with ID:', docRef.id);

    // Increment project count if asset is assigned to a project
    if (projectId) {
      await updateDoc(doc(db, 'projects', projectId), {
        assetCount: increment(1)
      });
      console.log('✅ Incremented count for project:', projectId);
    }

    // Increment collection count if asset is assigned to a collection
    if (collectionId) {
      await updateDoc(doc(db, 'collections', collectionId), {
        assetCount: increment(1)
      });
      console.log('✅ Incremented count for collection:', collectionId);
    }

    return NextResponse.json({
      success: true,
      assetId: docRef.id,
      message: 'Asset saved successfully!'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving asset:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save asset'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

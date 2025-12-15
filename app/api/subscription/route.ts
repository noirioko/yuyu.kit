import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Free tier limits
export const FREE_LIMITS = {
  maxAssets: 50,
  maxProjects: 3,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Get user document
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // User doesn't exist in users collection - they're on free tier
      return NextResponse.json({
        subscription: 'free',
        limits: FREE_LIMITS,
        isPremium: false,
      });
    }

    const userData = userSnap.data();
    const subscription = userData.subscription || 'free';
    const isPremium = subscription === 'premium';

    return NextResponse.json({
      subscription,
      subscriptionType: userData.subscriptionType || null,
      purchaseDate: userData.purchaseDate?.toDate?.() || null,
      limits: isPremium ? null : FREE_LIMITS,
      isPremium,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

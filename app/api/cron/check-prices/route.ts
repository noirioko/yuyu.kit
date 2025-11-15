import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// This endpoint is called by Vercel Cron to check prices for all users daily
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting daily price check cron job...');

    // Get all unique user IDs from assets collection
    const assetsRef = collection(db, 'assets');
    const assetsQuery = query(assetsRef, where('url', '!=', null));
    const snapshot = await getDocs(assetsQuery);

    const userIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });

    console.log(`👥 Found ${userIds.size} users with assets to check`);

    const results = {
      users: userIds.size,
      totalChecked: 0,
      totalUpdated: 0,
      totalOnSale: 0,
      totalErrors: 0,
      userResults: [] as any[]
    };

    // Check prices for each user
    for (const userId of userIds) {
      try {
        console.log(`🔍 Checking prices for user: ${userId}`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/check-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        const result = await response.json();

        if (result.success) {
          const { checked, updated, onSale, errors } = result.results;
          results.totalChecked += checked;
          results.totalUpdated += updated;
          results.totalOnSale += onSale;
          results.totalErrors += errors;

          results.userResults.push({
            userId,
            checked,
            updated,
            onSale,
            errors
          });

          console.log(`✅ User ${userId}: ${checked} checked, ${updated} updated, ${onSale} on sale`);
        } else {
          console.error(`❌ Failed for user ${userId}:`, result.error);
          results.totalErrors++;
        }

        // Add delay between users to avoid overwhelming the scrape API
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`💥 Error checking user ${userId}:`, error);
        results.totalErrors++;
      }
    }

    console.log('✅ Daily price check cron job complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Daily price check completed',
      results
    });

  } catch (error) {
    console.error('💥 Error in cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

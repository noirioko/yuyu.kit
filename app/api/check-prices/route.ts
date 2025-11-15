import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting price check for user:', userId);

    // Get all assets for this user that have a URL and current price
    const assetsRef = collection(db, 'assets');
    const q = query(
      assetsRef,
      where('userId', '==', userId),
      where('url', '!=', null)
    );
    const snapshot = await getDocs(q);

    console.log(`📦 Found ${snapshot.docs.length} assets to check`);

    const results = {
      checked: 0,
      updated: 0,
      onSale: 0,
      errors: 0,
      details: [] as any[]
    };

    // Check each asset
    for (const assetDoc of snapshot.docs) {
      const asset = assetDoc.data();
      const assetId = assetDoc.id;

      // Skip if no current price to compare against
      if (!asset.currentPrice) {
        console.log(`⏭️  Skipping ${asset.title} (no price to track)`);
        continue;
      }

      try {
        console.log(`🔎 Checking price for: ${asset.title}`);
        results.checked++;

        // Scrape current price from URL
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: asset.url })
        });

        const scrapeResult = await scrapeResponse.json();

        if (!scrapeResult.success || !scrapeResult.data?.price) {
          console.log(`❌ Could not fetch price for ${asset.title}`);
          results.errors++;
          results.details.push({
            id: assetId,
            title: asset.title,
            status: 'error',
            message: 'Could not fetch current price'
          });
          continue;
        }

        const newPrice = scrapeResult.data.price;
        const oldPrice = asset.currentPrice;

        console.log(`💰 ${asset.title}: ${asset.currency}${oldPrice} → ${asset.currency}${newPrice}`);

        // Check if price changed
        if (Math.abs(newPrice - oldPrice) > 0.01) { // Allow 1 cent tolerance for rounding
          const priceHistory = asset.priceHistory || [];
          const now = Timestamp.now();

          // Add to price history
          priceHistory.push({
            price: newPrice,
            currency: asset.currency || '$',
            checkedAt: now.toDate()
          });

          // Update lowest price if needed
          let lowestPrice = asset.lowestPrice || oldPrice;
          if (newPrice < lowestPrice) {
            lowestPrice = newPrice;
          }

          // Determine if on sale
          const isOnSale = newPrice < oldPrice;

          // Keep original price tracking
          let originalPrice = asset.originalPrice;
          if (!originalPrice && newPrice < oldPrice) {
            // If this is the first time we see a price drop, set original price
            originalPrice = oldPrice;
          }

          // Update the asset
          await updateDoc(doc(db, 'assets', assetId), {
            currentPrice: newPrice,
            originalPrice: originalPrice || null,
            isOnSale: isOnSale,
            lowestPrice: lowestPrice,
            priceHistory: priceHistory,
            lastPriceCheck: now,
            updatedAt: now
          });

          results.updated++;

          if (isOnSale) {
            results.onSale++;
            const discount = Math.round((1 - newPrice / oldPrice) * 100);
            results.details.push({
              id: assetId,
              title: asset.title,
              status: 'sale',
              oldPrice: oldPrice,
              newPrice: newPrice,
              discount: discount,
              message: `🎉 On sale! ${discount}% off`
            });
            console.log(`🎉 ${asset.title} is now on sale! ${discount}% off`);
          } else {
            results.details.push({
              id: assetId,
              title: asset.title,
              status: 'updated',
              oldPrice: oldPrice,
              newPrice: newPrice,
              message: `Price updated`
            });
            console.log(`📊 ${asset.title} price updated`);
          }
        } else {
          // Price unchanged, just update last check time
          await updateDoc(doc(db, 'assets', assetId), {
            lastPriceCheck: Timestamp.now()
          });

          results.details.push({
            id: assetId,
            title: asset.title,
            status: 'unchanged',
            price: oldPrice,
            message: 'Price unchanged'
          });
          console.log(`✓ ${asset.title} price unchanged`);
        }

      } catch (error) {
        console.error(`❌ Error checking ${asset.title}:`, error);
        results.errors++;
        results.details.push({
          id: assetId,
          title: asset.title,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Add small delay to avoid overwhelming marketplace servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Price check complete:', results);

    return NextResponse.json({
      success: true,
      results: {
        checked: results.checked,
        updated: results.updated,
        onSale: results.onSale,
        errors: results.errors,
        details: results.details
      }
    });

  } catch (error) {
    console.error('💥 Error in price check:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

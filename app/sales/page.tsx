'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Asset } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface SaleItem {
  title: string;
  url: string;
  originalPrice?: string;
  salePrice?: string;
  discount?: string;
  thumbnailUrl?: string;
  scrapedAt?: string;
}

interface SalesData {
  items: SaleItem[];
  lastUpdated: string;
}

export default function SalesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [manualSaleAssets, setManualSaleAssets] = useState<Asset[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchedItems, setMatchedItems] = useState<{asset: Asset, saleItem: SaleItem}[]>([]);

  // Load user's ACON wishlist assets
  useEffect(() => {
    if (!user || !db) return;

    const assetsQuery = query(
      collection(db, 'assets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Asset[];

      // Filter to ACON wishlist items only
      const aconWishlist = assetsData.filter(a =>
        a.platform?.toLowerCase().includes('acon') &&
        a.status === 'wishlist'
      );
      setAssets(aconWishlist);

      // Also get items manually marked as on sale (any platform, wishlist status)
      const manualSales = assetsData.filter(a =>
        a.isOnSale === true &&
        a.status === 'wishlist'
      );
      setManualSaleAssets(manualSales);
    });

    return () => unsubscribe();
  }, [user]);

  // Load sales data from Firebase
  useEffect(() => {
    if (!user || !db) return;

    const firestore = db; // Capture for TypeScript narrowing

    const loadSalesData = async () => {
      try {
        const salesRef = doc(firestore, 'sales', user.uid);
        const salesSnap = await getDoc(salesRef);

        if (salesSnap.exists()) {
          setSalesData(salesSnap.data() as SalesData);
        }
      } catch (error) {
        console.error('Error loading sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [user]);

  // Match wishlist items with sale items
  useEffect(() => {
    if (!salesData?.items || assets.length === 0) {
      setMatchedItems([]);
      return;
    }

    const matches: {asset: Asset, saleItem: SaleItem}[] = [];

    for (const asset of assets) {
      // Try to match by URL first
      let matchedSale = salesData.items.find(sale =>
        asset.url && sale.url &&
        asset.url.includes(sale.url.split('/').pop() || '')
      );

      // If no URL match, try fuzzy title match
      if (!matchedSale && asset.title) {
        const assetTitleLower = asset.title.toLowerCase();
        matchedSale = salesData.items.find(sale => {
          const saleTitleLower = sale.title.toLowerCase();
          // Check if titles are similar (contains or close match)
          return assetTitleLower.includes(saleTitleLower) ||
                 saleTitleLower.includes(assetTitleLower) ||
                 similarity(assetTitleLower, saleTitleLower) > 0.7;
        });
      }

      if (matchedSale) {
        matches.push({ asset, saleItem: matchedSale });
      }
    }

    setMatchedItems(matches);
  }, [salesData, assets]);

  // Simple string similarity function
  function similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  }

  function editDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view sales</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'night' ? 'bg-[#0a1c3d]' : 'bg-gray-50'}`}>
      {/* Header - same style as Dashboard */}
      <header className={`border-b transition-colors duration-300 sticky top-0 z-[500] ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#101c29] via-[#0a1c3d] via-[#131f5a] via-[#3f3381] to-[#2868c6] backdrop-blur-lg border-[#2868c6]/30'
          : 'bg-gradient-to-r from-[#91d2f4]/90 via-[#cba2ea]/80 to-[#91d2f4]/90 border-gray-200'
      }`}>
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-6">
              {/* Back button on mobile */}
              <button
                onClick={() => router.push('/')}
                className={`sm:hidden p-2 -ml-2 rounded-lg transition ${
                  theme === 'night' ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/')}
                className="hidden sm:flex items-center gap-2 md:gap-3 hover:opacity-80 transition cursor-pointer"
              >
                <img
                  src="/yuyu_mojis/yuwon_veryhappy.png"
                  alt="MyPebbles"
                  className="h-8 md:h-10 w-auto rounded-lg object-contain"
                />
                <span className={`text-xl md:text-2xl font-semibold ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>MyPebbles</span>
              </button>
              <span className={`sm:hidden text-lg font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Sales</span>
              <span className={`hidden sm:inline ${theme === 'night' ? 'text-white/40' : 'text-gray-400'}`}>/</span>
              <span className={`hidden sm:inline text-lg md:text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>🔥 ACON3D Sales</span>
            </div>
            <a
              href="https://www.acon3d.com/en/event/sale"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                theme === 'night'
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-white text-[#2868c6] hover:bg-gray-50 border border-gray-200'
              }`}
            >
              View All Sales →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4 ${
              theme === 'night' ? 'border-white' : 'border-[#2868c6]'
            }`} />
            <p className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>Loading...</p>
          </div>
        ) : !salesData ? (
          <div className={`text-center py-12 rounded-xl ${
            theme === 'night' ? 'bg-white/5' : 'bg-white'
          }`}>
            <div className="text-6xl mb-4">🛒</div>
            <h2 className={`text-xl font-bold mb-2 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              No Sales Data Yet
            </h2>
            <p className={`mb-6 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>
              Use the browser extension to sync ACON3D sale items
            </p>
            <div className={`p-4 rounded-lg inline-block text-left ${
              theme === 'night' ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <p className={`text-sm font-medium mb-2 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                How to sync:
              </p>
              <ol className={`text-sm space-y-1 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>
                <li>1. Open the MyPebbles extension</li>
                <li>2. Click "Check ACON Sales"</li>
                <li>3. Wait for sync to complete</li>
                <li>4. Refresh this page</li>
              </ol>
            </div>
          </div>
        ) : matchedItems.length === 0 ? (
          <div className={`text-center py-12 rounded-xl ${
            theme === 'night' ? 'bg-white/5' : 'bg-white'
          }`}>
            <div className="text-6xl mb-4">😌</div>
            <h2 className={`text-xl font-bold mb-2 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              No Wishlist Items on Sale
            </h2>
            <p className={`mb-4 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>
              None of your {assets.length} ACON wishlist items are currently on sale
            </p>
            <p className={`text-sm ${theme === 'night' ? 'text-white/50' : 'text-gray-500'}`}>
              Last checked: {new Date(salesData.lastUpdated).toLocaleString()}
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className={`mb-6 p-4 rounded-xl ${
              theme === 'night' ? 'bg-green-500/20' : 'bg-green-50'
            }`}>
              <p className={`font-medium ${theme === 'night' ? 'text-green-300' : 'text-green-700'}`}>
                🎉 {matchedItems.length} of your wishlist items are on sale!
              </p>
              <p className={`text-sm mt-1 ${theme === 'night' ? 'text-green-300/70' : 'text-green-600'}`}>
                Last updated: {new Date(salesData.lastUpdated).toLocaleString()}
              </p>
            </div>

            {/* Matched Items Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedItems.map(({ asset, saleItem }) => (
                <a
                  key={asset.id}
                  href={saleItem.url || asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-xl overflow-hidden transition hover:shadow-lg ${
                    theme === 'night'
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                      : 'bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 relative">
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎨
                      </div>
                    )}
                    {/* Sale Badge */}
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {saleItem.discount || 'SALE'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className={`font-medium mb-2 line-clamp-2 ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {asset.title}
                    </h3>

                    {/* Prices */}
                    <div className="flex items-center gap-2">
                      {saleItem.originalPrice && (
                        <span className={`text-sm line-through ${
                          theme === 'night' ? 'text-white/50' : 'text-gray-400'
                        }`}>
                          {saleItem.originalPrice}
                        </span>
                      )}
                      {saleItem.salePrice && (
                        <span className="text-lg font-bold text-red-500">
                          {saleItem.salePrice}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs mt-2 ${
                      theme === 'night' ? 'text-white/50' : 'text-gray-500'
                    }`}>
                      Click to view on ACON3D →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Manually Marked as On Sale - Grouped by Platform */}
        {(() => {
          const matchedIds = new Set(matchedItems.map(m => m.asset.id));
          const uniqueManualSales = manualSaleAssets.filter(a => !matchedIds.has(a.id));

          // Group by platform
          const groupedByPlatform = uniqueManualSales.reduce((acc, asset) => {
            const platform = asset.platform || 'Other';
            if (!acc[platform]) acc[platform] = [];
            acc[platform].push(asset);
            return acc;
          }, {} as Record<string, Asset[]>);

          const platformOrder = ['ACON3D', 'VGEN', 'Clip Studio', 'Gumroad', 'ArtStation', 'Amazon', 'Other'];
          const sortedPlatforms = Object.keys(groupedByPlatform).sort((a, b) => {
            const aIndex = platformOrder.indexOf(a);
            const bIndex = platformOrder.indexOf(b);
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
          });

          return uniqueManualSales.length > 0 && (
          <div className="mt-12">
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              <span>🏷️ Your Items Marked as On Sale</span>
              <span className={`text-sm font-normal ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>
                ({uniqueManualSales.length} items)
              </span>
            </h2>
            <p className={`text-sm mb-4 ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>
              Items you manually marked as on sale in the Edit modal
            </p>

            {sortedPlatforms.map(platform => (
              <div key={platform} className="mb-8">
                <h3 className={`text-md font-semibold mb-3 flex items-center gap-2 ${theme === 'night' ? 'text-white/80' : 'text-gray-700'}`}>
                  <span>{platform}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    theme === 'night' ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {groupedByPlatform[platform].length}
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedByPlatform[platform].map(asset => (
                <a
                  key={asset.id}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-xl overflow-hidden transition hover:shadow-lg ${
                    theme === 'night'
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                      : 'bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 relative">
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎨
                      </div>
                    )}
                    {/* Sale Badge */}
                    {asset.originalPrice && asset.currentPrice && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{Math.round((1 - asset.currentPrice / asset.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className={`font-medium mb-2 line-clamp-2 ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {asset.title}
                    </h3>

                    {/* Prices */}
                    <div className="flex items-center gap-2">
                      {asset.originalPrice && (
                        <span className={`text-sm line-through ${
                          theme === 'night' ? 'text-white/50' : 'text-gray-400'
                        }`}>
                          {asset.currency}{asset.originalPrice.toFixed(2)}
                        </span>
                      )}
                      {asset.currentPrice && (
                        <span className="text-lg font-bold text-red-500">
                          {asset.currency}{asset.currentPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {asset.platform && (
                      <p className={`text-xs mt-2 ${
                        theme === 'night' ? 'text-white/50' : 'text-gray-500'
                      }`}>
                        {asset.platform} →
                      </p>
                    )}
                  </div>
                </a>
              ))}
                </div>
              </div>
            ))}
          </div>
        );})()}

        {/* All Wishlist Items */}
        {assets.length > 0 && (
          <div className="mt-12">
            <h2 className={`text-lg font-bold mb-4 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Your ACON3D Wishlist ({assets.length} items)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {assets.map(asset => (
                <a
                  key={asset.id}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg overflow-hidden transition ${
                    theme === 'night'
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'bg-white hover:shadow-md'
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20">
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">🎨</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className={`text-xs line-clamp-2 ${
                      theme === 'night' ? 'text-white/70' : 'text-gray-600'
                    }`}>
                      {asset.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

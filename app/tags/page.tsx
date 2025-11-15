'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Asset } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ViewAssetModal from '@/components/ViewAssetModal';
import EditAssetModal from '@/components/EditAssetModal';

export default function TagsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Load assets
  useEffect(() => {
    if (!user || !db) return;

    const assetsQuery = query(collection(db, 'assets'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Asset[];
      setAssets(assetsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate tag statistics
  const tagStats = useMemo(() => {
    const stats = new Map<string, { count: number; assetIds: string[] }>();

    assets.forEach(asset => {
      if (asset.tags && asset.tags.length > 0) {
        asset.tags.forEach(tag => {
          const existing = stats.get(tag) || { count: 0, assetIds: [] };
          stats.set(tag, {
            count: existing.count + 1,
            assetIds: [...existing.assetIds, asset.id]
          });
        });
      }
    });

    return Array.from(stats.entries())
      .map(([tag, data]) => ({ tag, count: data.count, assetIds: data.assetIds }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [assets]);

  // Filter tags by search term
  const filteredTags = useMemo(() => {
    if (!searchTerm) return tagStats;
    return tagStats.filter(({ tag }) =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tagStats, searchTerm]);

  // Get assets for selected tag
  const selectedAssets = useMemo(() => {
    if (!selectedTag) return [];
    return assets.filter(asset => asset.tags?.includes(selectedTag));
  }, [selectedTag, assets]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:opacity-80 transition"
              >
                <img
                  src="/yuyu_mojis/yuwon_veryhappy.png"
                  alt="MyPebbles"
                  className="h-10 w-auto rounded-lg object-contain"
                />
                <span className="text-2xl font-semibold text-gray-800">MyPebbles</span>
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-xl font-medium text-gray-600">Tags</span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={user?.photoURL || ''}
                alt={user?.displayName || ''}
                className="w-10 h-10 rounded-full"
              />
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Tags Sidebar */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                All Tags ({tagStats.length})
              </h2>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags Pills */}
              <div className="flex flex-wrap gap-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8 w-full">
                    {searchTerm ? 'No tags found' : 'No tags yet. Save some assets to see tags!'}
                  </p>
                ) : (
                  filteredTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        selectedTag === tag
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedTag === tag
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="col-span-8">
            {selectedTag ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Assets tagged with "{selectedTag}"
                  </h2>
                  <p className="text-gray-600">
                    {selectedAssets.length} {selectedAssets.length === 1 ? 'asset' : 'assets'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition relative group cursor-pointer"
                      onClick={() => setViewingAsset(asset)}
                    >
                      {/* Status Ribbon */}
                      <div className={`absolute top-3 left-0 z-10 px-3 py-1 text-xs font-semibold text-white shadow-md ${
                        asset.status === 'wishlist' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        asset.status === 'bought' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`} style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)' }}>
                        {asset.status === 'wishlist' ? '📌 Wishlist' :
                         asset.status === 'bought' ? '✅ Bought' :
                         '🎨 In Use'}
                      </div>

                      {/* Sale Badge */}
                      {asset.isOnSale && asset.originalPrice && (
                        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          -{Math.round((1 - asset.currentPrice! / asset.originalPrice) * 100)}% OFF
                        </div>
                      )}

                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center overflow-hidden">
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-1 truncate">{asset.title}</h3>
                        {asset.creator && (
                          <p className="text-xs text-gray-600 mb-2">by {asset.creator}</p>
                        )}
                        {asset.currentPrice && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {asset.isOnSale && asset.originalPrice && (
                                <span className="text-sm font-medium text-gray-400" style={{ textDecoration: 'line-through' }}>
                                  {asset.currency}{asset.originalPrice.toFixed(2)}
                                </span>
                              )}
                              <span className={`text-lg font-bold ${asset.isOnSale ? 'text-red-600' : 'text-blue-600'}`}>
                                {asset.currency}{asset.currentPrice.toFixed(2)}
                              </span>
                            </div>
                            {asset.lowestPrice && asset.currentPrice > asset.lowestPrice && !asset.isOnSale && (
                              <span className="text-xs text-gray-500 mt-1 block">
                                Lowest seen: {asset.currency}{asset.lowestPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        {asset.platform && (
                          <p className="text-xs text-gray-500 mb-2">{asset.platform}</p>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {asset.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {asset.tags.length > 3 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                +{asset.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Online →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🏷️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Browse by Tags
                </h2>
                <p className="text-gray-600">
                  Select a tag from the sidebar to view related assets
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingAsset && (
        <ViewAssetModal
          asset={viewingAsset}
          onClose={() => setViewingAsset(null)}
          onEdit={() => {
            setEditingAsset(viewingAsset);
            setViewingAsset(null);
          }}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          projects={[]}
          collections={[]}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
}

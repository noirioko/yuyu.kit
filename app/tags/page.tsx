'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Asset } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function TagsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
                  alt="YuyuAsset"
                  className="h-10 w-auto rounded-lg object-contain"
                />
                <span className="text-2xl font-semibold text-gray-800">YuyuAsset</span>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedTag === tag
                          ? 'bg-purple-500 text-white'
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

                <div className="grid grid-cols-2 gap-4">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => router.push(`/?asset=${asset.id}`)}
                    >
                      {/* Thumbnail */}
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                          {asset.title}
                        </h3>

                        {/* Platform/Creator */}
                        {asset.creator && (
                          <p className="text-sm text-gray-500 mb-2">by {asset.creator}</p>
                        )}

                        {/* Price */}
                        {asset.currentPrice && (
                          <div className="mb-2">
                            {asset.isOnSale && asset.originalPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-bold">
                                  {asset.currency}{asset.currentPrice}
                                </span>
                                <span className="text-gray-400 text-sm line-through">
                                  {asset.currency}{asset.originalPrice}
                                </span>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                  -{Math.round((1 - asset.currentPrice / asset.originalPrice) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-700 font-medium">
                                {asset.currency}{asset.currentPrice}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {asset.tags?.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded-full ${
                                tag === selectedTag
                                  ? 'bg-purple-100 text-purple-700 font-semibold'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {asset.tags && asset.tags.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                              +{asset.tags.length - 3}
                            </span>
                          )}
                        </div>
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
    </div>
  );
}

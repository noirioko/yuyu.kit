'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Asset, Project, Collection as CollectionType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ViewAssetModal from '@/components/ViewAssetModal';
import EditAssetModal from '@/components/EditAssetModal';

export default function TagsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // Load projects
  useEffect(() => {
    if (!user || !db) return;

    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Project[];
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Load collections
  useEffect(() => {
    if (!user || !db) return;

    const collectionsQuery = query(collection(db, 'collections'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(collectionsQuery, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CollectionType[];
      setCollections(collectionsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleDeleteAllData = async () => {
    if (!user || !db) return;

    const confirmation = prompt(
      `⚠️ WARNING: This will permanently delete ALL your data!\n\n` +
      `This includes:\n` +
      `• ${assets.length} assets\n` +
      `• ${projects.length} projects\n` +
      `• ${collections.length} collections\n\n` +
      `Type "DELETE ALL" to confirm:`
    );

    if (confirmation !== 'DELETE ALL') {
      alert('Deletion cancelled. Your data is safe.');
      return;
    }

    try {
      console.log('🗑️ Deleting all user data...');

      // Delete all assets
      for (const asset of assets) {
        await deleteDoc(doc(db, 'assets', asset.id));
      }
      console.log(`✅ Deleted ${assets.length} assets`);

      // Delete all projects
      for (const project of projects) {
        await deleteDoc(doc(db, 'projects', project.id));
      }
      console.log(`✅ Deleted ${projects.length} projects`);

      // Delete all collections
      for (const collection of collections) {
        await deleteDoc(doc(db, 'collections', collection.id));
      }
      console.log(`✅ Deleted ${collections.length} collections`);

      alert('All data has been permanently deleted.');
      console.log('✅ All user data deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting data:', error);
      alert('Failed to delete all data. Some items may remain. Check console for details.');
    }
  };

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

  // Delete asset handler
  const handleDeleteAsset = async (assetId: string) => {
    if (!db) return;

    try {
      const asset = assets.find(a => a.id === assetId);

      await deleteDoc(doc(db, 'assets', assetId));

      if (asset?.projectId) {
        await updateDoc(doc(db, 'projects', asset.projectId), {
          assetCount: increment(-1)
        });
      }

      if (asset?.collectionId) {
        await updateDoc(doc(db, 'collections', asset.collectionId), {
          assetCount: increment(-1)
        });
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset');
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'night' ? 'bg-[#0a1c3d]' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>Please sign in</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg hover:shadow-lg transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'night' ? 'bg-[#0a1c3d]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#101c29] via-[#0a1c3d] via-[#131f5a] via-[#3f3381] to-[#2868c6] border-[#2868c6]/30'
          : 'bg-white border-gray-200'
      }`}>
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
                <span className={`text-2xl font-semibold ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>MyPebbles</span>
              </button>
              <span className={theme === 'night' ? 'text-white/40' : 'text-gray-400'}>/</span>
              <span className={`text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>Tags</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <img
                    src={user?.photoURL || ''}
                    alt={user?.displayName || ''}
                    className="w-10 h-10 rounded-full"
                  />
                  <svg className={`w-4 h-4 ${theme === 'night' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileMenu && (
                  <div
                    ref={profileMenuRef}
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border py-2 z-[200] ${
                      theme === 'night'
                        ? 'bg-[#0a1c3d] border-white/20'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-2 border-b ${theme === 'night' ? 'border-white/10' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>{user?.displayName}</p>
                      <p className={`text-xs ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        router.push('/about');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>About</span>
                    </button>

                    <button
                      onClick={() => {
                        router.push('/overview');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Overview</span>
                    </button>

                    <button
                      onClick={toggleTheme}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      {theme === 'night' ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span>{theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}</span>
                    </button>

                    <div className={`border-t my-2 ${theme === 'night' ? 'border-white/10' : 'border-gray-100'}`}></div>

                    <button
                      onClick={() => {
                        handleDeleteAllData();
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        theme === 'night'
                          ? 'text-red-400 hover:bg-red-400/10'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete All Data</span>
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Tags Sidebar */}
          <div className="col-span-3">
            <div className={`rounded-xl shadow-sm p-6 sticky top-6 transition-colors ${
              theme === 'night'
                ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                : 'bg-white'
            }`}>
              <h2 className={`text-xl font-bold mb-4 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>
                All Tags ({tagStats.length})
              </h2>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2868c6] focus:border-transparent transition ${
                    theme === 'night'
                      ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Tags Pills */}
              <div className="flex flex-wrap gap-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <p className={`text-sm text-center py-8 w-full ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    {searchTerm ? 'No tags found' : 'No tags yet. Save some assets to see tags!'}
                  </p>
                ) : (
                  filteredTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        selectedTag === tag
                          ? theme === 'night'
                            ? 'bg-[#91d2f4]/30 text-white shadow-sm'
                            : 'bg-[#2868c6] text-white shadow-sm'
                          : theme === 'night'
                          ? 'bg-white/10 text-white/80 hover:bg-white/20'
                          : 'bg-gray-100 text-gray-700 hover:bg-[#91d2f4]/20 hover:text-[#2868c6]'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedTag === tag
                          ? theme === 'night'
                            ? 'bg-[#2868c6] text-white'
                            : 'bg-[#3f3381] text-white'
                          : theme === 'night'
                          ? 'bg-white/20 text-white/90'
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
          <div className="col-span-9">
            {selectedTag ? (
              <div>
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold mb-2 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Assets tagged with "{selectedTag}"
                  </h2>
                  <p className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>
                    {selectedAssets.length} {selectedAssets.length === 1 ? 'asset' : 'assets'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className={`rounded-xl shadow-sm overflow-hidden hover:shadow-md transition relative group cursor-pointer ${
                        theme === 'night'
                          ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                          : 'bg-white'
                      }`}
                      onClick={() => setViewingAsset(asset)}
                    >
                      {/* Status Ribbon */}
                      <div className={`absolute top-3 left-0 z-10 px-3 py-1 text-xs font-semibold text-white shadow-md ${
                        asset.status === 'wishlist' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        asset.status === 'bought' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        'bg-gradient-to-r from-[#2868c6] to-[#3f3381]'
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

                      <div className="aspect-video bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 flex items-center justify-center overflow-hidden">
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-[#91d2f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className={`font-semibold mb-1 truncate ${
                          theme === 'night' ? 'text-white' : 'text-gray-800'
                        }`}>{asset.title}</h3>
                        {asset.creator && (
                          <p className={`text-xs mb-2 ${
                            theme === 'night' ? 'text-white/70' : 'text-gray-600'
                          }`}>by {asset.creator}</p>
                        )}
                        {(asset.currentPrice || asset.currentPrice === 0) && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {asset.isOnSale && asset.originalPrice && asset.originalPrice > 0 && (
                                <span className="text-sm font-medium text-gray-400" style={{ textDecoration: 'line-through' }}>
                                  {asset.currency === 'Gold' || asset.currency === 'Clippy'
                                    ? `${asset.originalPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                                    : `${asset.currency}${asset.originalPrice.toFixed(2)}`}
                                </span>
                              )}
                              <span className={`text-lg font-bold ${
                                asset.currentPrice === 0 || asset.currency?.toLowerCase() === 'free'
                                  ? 'text-green-600'
                                  : asset.isOnSale
                                  ? 'text-red-600'
                                  : 'text-[#2868c6]'
                              }`}>
                                {asset.currentPrice === 0 || asset.currency?.toLowerCase() === 'free'
                                  ? 'FREE'
                                  : asset.currency === 'Gold' || asset.currency === 'Clippy'
                                  ? `${asset.currentPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                                  : `${asset.currency}${asset.currentPrice.toFixed(2)}`}
                              </span>
                            </div>
                            {asset.lowestPrice && asset.lowestPrice > 0 && asset.currentPrice > asset.lowestPrice && !asset.isOnSale && asset.currency?.toLowerCase() !== 'free' && (
                              <span className={`text-xs mt-1 block ${
                                theme === 'night' ? 'text-white/60' : 'text-gray-500'
                              }`}>
                                Lowest seen: {asset.currency === 'Gold' || asset.currency === 'Clippy'
                                  ? `${asset.lowestPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                                  : `${asset.currency}${asset.lowestPrice.toFixed(2)}`}
                              </span>
                            )}
                          </div>
                        )}
                        {asset.platform && (
                          <p className={`text-xs mb-2 ${
                            theme === 'night' ? 'text-white/60' : 'text-gray-500'
                          }`}>{asset.platform}</p>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {asset.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  theme === 'night'
                                    ? 'bg-[#91d2f4]/30 text-white'
                                    : 'bg-[#91d2f4]/20 text-[#2868c6]'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {asset.tags.length > 3 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                theme === 'night'
                                  ? 'bg-white/10 text-white/70'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
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
                          className={`text-sm font-medium ${
                            theme === 'night'
                              ? 'text-[#91d2f4] hover:text-[#cba2ea]'
                              : 'text-[#2868c6] hover:text-[#3f3381]'
                          }`}
                        >
                          View Online →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`rounded-xl shadow-sm p-12 text-center transition-colors ${
                theme === 'night'
                  ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                  : 'bg-white'
              }`}>
                <div className="text-6xl mb-4">🏷️</div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>
                  Browse by Tags
                </h2>
                <p className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>
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
          onDelete={async () => {
            if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
              await handleDeleteAsset(viewingAsset.id);
              setViewingAsset(null);
            }
          }}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          projects={projects}
          collections={collections}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
}

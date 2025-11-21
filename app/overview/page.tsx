'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Asset, Project, Collection as CollectionType } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PlatformStats {
  platform: string;
  wishlistCount: number;
  boughtCount: number;
  totalSpent: number;
  currency: string;
}

export default function OverviewPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState<{top: number, right: number} | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Generate stars for galaxy background
  const stars = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.3,
      animationDuration: Math.random() * 3 + 2,
      animationDelay: Math.random() * 2,
    }));
  }, []);

  // Fetch assets
  useEffect(() => {
    if (!user || !db) {
      router.push('/');
      return;
    }

    const q = query(collection(db, 'assets'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Asset));
      setAssets(assetData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  // Fetch projects
  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

  // Fetch collections
  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, 'collections'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

  // Calculate platform statistics
  const platformStats = useMemo(() => {
    const stats = new Map<string, PlatformStats>();

    assets.forEach(asset => {
      const platform = asset.platform || 'Other';

      if (!stats.has(platform)) {
        stats.set(platform, {
          platform,
          wishlistCount: 0,
          boughtCount: 0,
          totalSpent: 0,
          currency: asset.currency || '$'
        });
      }

      const stat = stats.get(platform)!;

      if (asset.status === 'wishlist') {
        stat.wishlistCount++;
      } else if (asset.status === 'bought') {
        stat.boughtCount++;
        stat.totalSpent += asset.currentPrice || 0;
      }
    });

    return Array.from(stats.values()).sort((a, b) =>
      (b.wishlistCount + b.boughtCount) - (a.wishlistCount + a.boughtCount)
    );
  }, [assets]);

  // Calculate totals
  const totals = useMemo(() => {
    const wishlistCount = assets.filter(a => a.status === 'wishlist').length;
    const boughtCount = assets.filter(a => a.status === 'bought').length;
    const totalSpent = assets
      .filter(a => a.status === 'bought')
      .reduce((sum, a) => sum + (a.currentPrice || 0), 0);

    return { wishlistCount, boughtCount, totalSpent };
  }, [assets]);

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 sticky top-0 z-50 ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#0a1c3d] via-[#1a2332] to-[#0a1c3d] border-white/10'
          : 'bg-gradient-to-r from-[#91d2f4]/30 via-[#cba2ea]/20 to-[#91d2f4]/30 border-gray-200'
      }`}>
        {/* Animated Stars (Night Mode Only) */}
        {theme === 'night' && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute bg-white rounded-full animate-twinkle"
                style={{
                  width: `${star.width}px`,
                  height: `${star.height}px`,
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  opacity: star.opacity,
                  animationDuration: `${star.animationDuration}s`,
                  animationDelay: `${star.animationDelay}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="container mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
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
              }`}>Overview</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => {
                    if (profileButtonRef.current) {
                      const rect = profileButtonRef.current.getBoundingClientRect();
                      setProfileMenuPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right
                      });
                    }
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
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

                {showProfileMenu && profileMenuPosition && typeof window !== 'undefined' && createPortal(
                  <div
                    ref={profileMenuRef}
                    className={`fixed w-56 rounded-xl shadow-lg border py-2 ${
                      theme === 'night'
                        ? 'bg-[#0a1c3d] border-white/20'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{
                      top: `${profileMenuPosition.top}px`,
                      right: `${profileMenuPosition.right}px`,
                      zIndex: 99999
                    }}
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
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
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
                        router.push('/tags');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Browse Tags</span>
                    </button>

                    <button
                      onClick={toggleTheme}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
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
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
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
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
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
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: 'url(/images/pebbles-bg.jpg)',
            opacity: 0.2
          }}
        />
        {/* White overlay for day mode */}
        {theme !== 'night' && (
          <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: 0.5 }} />
        )}

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 flex-shrink-0 text-[#cba2ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h1 className={`text-4xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Overview</h1>
            </div>
            <p className={`text-sm ${
              theme === 'night' ? 'text-white/60' : 'text-gray-500'
            }`}>Track your asset collection and spending across all platforms</p>
          </div>

          {loading ? (
            <div className={`text-center py-12 ${
              theme === 'night' ? 'text-white/60' : 'text-gray-500'
            }`}>
              Loading statistics...
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`rounded-2xl shadow-sm p-6 ${
                  theme === 'night'
                    ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                    : 'bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#91d2f4]/20">
                      <svg className="w-6 h-6 text-[#91d2f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>Wishlist</h3>
                  </div>
                  <p className={`text-4xl font-bold ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>{totals.wishlistCount}</p>
                  <p className={`text-sm mt-1 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Assets you want to buy</p>
                </div>

                <div className={`rounded-2xl shadow-sm p-6 ${
                  theme === 'night'
                    ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                    : 'bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#2868c6]/20">
                      <svg className="w-6 h-6 text-[#2868c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>Purchased</h3>
                  </div>
                  <p className={`text-4xl font-bold ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>{totals.boughtCount}</p>
                  <p className={`text-sm mt-1 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Assets you own</p>
                </div>

                <div className={`rounded-2xl shadow-sm p-6 ${
                  theme === 'night'
                    ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                    : 'bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#cba2ea]/20">
                      <svg className="w-6 h-6 text-[#cba2ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>Total Spent</h3>
                  </div>
                  <p className="text-4xl font-bold text-[#cba2ea]">
                    ${totals.totalSpent.toFixed(2)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Across all platforms</p>
                </div>
              </div>

              {/* Platform Breakdown */}
              <div className={`rounded-2xl shadow-sm overflow-hidden ${
                theme === 'night'
                  ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                  : 'bg-white'
              }`}>
                <div className={`p-6 border-b ${
                  theme === 'night' ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <h2 className={`text-2xl font-bold ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Platform Breakdown</h2>
                  <p className={`text-sm mt-1 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Detailed statistics for each platform</p>
                </div>

                {platformStats.length === 0 ? (
                  <div className={`p-12 text-center ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No assets tracked yet</p>
                    <p className="text-sm mt-2">Start adding assets to see your statistics!</p>
                  </div>
                ) : (
                  <div className={theme === 'night' ? 'divide-y divide-white/10' : 'divide-y divide-gray-200'}>
                    {platformStats.map((stat) => (
                      <div key={stat.platform} className={`p-6 transition ${
                        theme === 'night' ? '' : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className={`text-xl font-bold ${
                              theme === 'night' ? 'text-white' : 'text-gray-800'
                            }`}>{stat.platform}</h3>
                            <p className={`text-sm mt-1 ${
                              theme === 'night' ? 'text-white/60' : 'text-gray-500'
                            }`}>
                              {stat.wishlistCount + stat.boughtCount} total assets
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-lg ${
                            theme === 'night'
                              ? 'bg-[#cba2ea]/20'
                              : 'bg-[#cba2ea]/10'
                          }`}>
                            <p className={`text-sm ${
                              theme === 'night' ? 'text-white/60' : 'text-gray-600'
                            }`}>Spent</p>
                            <p className="text-2xl font-bold text-[#cba2ea]">
                              {stat.totalSpent === 0
                                ? 'FREE'
                                : stat.currency === 'Gold' || stat.currency === 'Clippy'
                                ? `${stat.totalSpent.toFixed(0)} ${stat.currency.toUpperCase()}`
                                : `${stat.currency}${stat.totalSpent.toFixed(2)}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg border ${
                            theme === 'night'
                              ? 'border-white/10 bg-white/5'
                              : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-[#91d2f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              <p className={`text-xs ${
                                theme === 'night' ? 'text-white/60' : 'text-gray-500'
                              }`}>Wishlist</p>
                            </div>
                            <p className={`text-3xl font-bold ${
                              theme === 'night' ? 'text-white' : 'text-gray-800'
                            }`}>{stat.wishlistCount}</p>
                          </div>

                          <div className={`p-4 rounded-lg border ${
                            theme === 'night'
                              ? 'border-white/10 bg-white/5'
                              : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-[#2868c6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <p className={`text-xs ${
                                theme === 'night' ? 'text-white/60' : 'text-gray-500'
                              }`}>Purchased</p>
                            </div>
                            <p className={`text-3xl font-bold ${
                              theme === 'night' ? 'text-white' : 'text-gray-800'
                            }`}>{stat.boughtCount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

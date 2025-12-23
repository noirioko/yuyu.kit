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

export default function AboutPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState<{top: number, right: number} | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch assets
  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, 'assets'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Asset));
      setAssets(assetData);
    });

    return () => unsubscribe();
  }, [user]);

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

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 relative ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#0a1c3d] via-[#1a2332] to-[#0a1c3d] border-white/10'
          : 'bg-gradient-to-r from-[#91d2f4]/90 via-[#cba2ea]/80 to-[#91d2f4]/90 border-gray-200'
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
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); router.push('/'); }}
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
              </a>
              <span className={`sm:hidden text-lg font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>About</span>
              <span className={`hidden sm:inline ${theme === 'night' ? 'text-white/40' : 'text-gray-400'}`}>/</span>
              <span className={`hidden sm:inline text-lg md:text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>About</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Show profile dropdown if logged in, otherwise show sign in button */}
              {user ? (
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
                          router.push('/');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
                          theme === 'night'
                            ? 'text-white hover:bg-white/10'
                            : 'text-gray-700 hover:bg-[#91d2f4]/20'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Dashboard</span>
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
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    theme === 'night'
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-[#2868c6] text-white hover:bg-[#2868c6]/90'
                  }`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative">
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

        <div className="max-w-3xl mx-auto relative">
          <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors ${
            theme === 'night'
              ? 'bg-white/5 backdrop-blur-lg border border-white/10'
              : 'bg-white'
          }`}>
            {/* Hero Image */}
            <div className="relative w-full h-48 overflow-hidden">
              <img
                src="/images/pond.png"
                alt="Peaceful pond"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/images/stone-stack.png"
                  alt="Stone stack"
                  className="w-10 h-10 object-contain"
                />
                <h1 className={`text-3xl font-bold ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>About MyPebbles</h1>
              </div>

            <div className="prose prose-blue max-w-none">
              <h2 className={`text-xl font-semibold mt-6 mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>What is MyPebbles?</h2>
              <p className={`mb-4 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                MyPebbles is your personal digital asset library for managing ACON3D, CSP, and other marketplace assets.
                Keep track of what you want to buy, what you've already bought, and organize everything by project!
              </p>

              {/* How to Use Section */}
              <h2 className={`text-xl font-semibold mt-8 mb-4 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>🚀 How to Use MyPebbles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Step 1 */}
                <div className={`rounded-xl p-4 text-center ${
                  theme === 'night'
                    ? 'bg-gradient-to-b from-[#2868c6]/20 to-[#91d2f4]/10 border border-white/10'
                    : 'bg-gradient-to-b from-[#91d2f4]/20 to-[#91d2f4]/5 border border-[#91d2f4]/30'
                }`}>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold ${
                    theme === 'night' ? 'bg-[#2868c6] text-white' : 'bg-[#2868c6] text-white'
                  }`}>1</div>
                  <h3 className={`font-semibold mb-1 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Install Extension</h3>
                  <p className={`text-xs mb-3 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Get our Chrome extension from the Web Store</p>
                  <a href="https://chromewebstore.google.com/detail/mypebbles-asset-manager/chedpgdgjdnjdfkkpebikmcdnlfafpda" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="w-full rounded-lg overflow-hidden hover:scale-105 transition-transform">
                      <img src="/images/ss-howto1.png" alt="Install Extension" className="w-full h-auto rounded-lg" />
                    </div>
                  </a>
                </div>

                {/* Step 2 */}
                <div className={`rounded-xl p-4 text-center ${
                  theme === 'night'
                    ? 'bg-gradient-to-b from-[#cba2ea]/20 to-[#cba2ea]/10 border border-white/10'
                    : 'bg-gradient-to-b from-[#cba2ea]/20 to-[#cba2ea]/5 border border-[#cba2ea]/30'
                }`}>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold ${
                    theme === 'night' ? 'bg-[#cba2ea] text-white' : 'bg-[#cba2ea] text-white'
                  }`}>2</div>
                  <h3 className={`font-semibold mb-1 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Copy User ID</h3>
                  <p className={`text-xs mb-3 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Click "Copy User ID" in the dashboard header</p>
                  <div className="w-full rounded-lg overflow-hidden">
                    <img src="/images/ss-howto2.png" alt="Copy User ID" className="w-full h-auto rounded-lg" />
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`rounded-xl p-4 text-center ${
                  theme === 'night'
                    ? 'bg-gradient-to-b from-[#91d2f4]/20 to-[#2868c6]/10 border border-white/10'
                    : 'bg-gradient-to-b from-[#2868c6]/20 to-[#2868c6]/5 border border-[#2868c6]/30'
                }`}>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold ${
                    theme === 'night' ? 'bg-[#3f3381] text-white' : 'bg-[#3f3381] text-white'
                  }`}>3</div>
                  <h3 className={`font-semibold mb-1 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Start Collecting!</h3>
                  <p className={`text-xs mb-3 ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-500'
                  }`}>Paste ID in extension & save assets with one click</p>
                  <div className="w-full rounded-lg overflow-hidden">
                    <img src="/images/ss-howto3.png" alt="Start Collecting" className="w-full h-auto rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Supported Platforms - Full Width Section */}
          <div
            className="relative -mx-8 px-8 py-8 my-8 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/kawaii-bg.jpg)' }}
          >
            <div className="relative z-10">
            <h2 className="text-xl font-semibold mb-6 text-[#2d1b69] text-center drop-shadow-sm">Supported Platforms</h2>

            {/* Best Supported */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#5a4a7e] mb-3 text-center uppercase tracking-wider">Best Support</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition">
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    A3D
                  </div>
                  <h4 className="font-semibold text-[#2d1b69] text-sm">ACON3D</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">3D assets & textures</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition">
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    CSP
                  </div>
                  <h4 className="font-semibold text-[#2d1b69] text-sm">Clip Studio</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Brushes & materials</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition">
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    AMZ
                  </div>
                  <h4 className="font-semibold text-[#2d1b69] text-sm">Amazon</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Multi-region support</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition">
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    VG
                  </div>
                  <h4 className="font-semibold text-[#2d1b69] text-sm">VGen</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Artist commissions</p>
                </div>
              </div>
            </div>

            {/* Also Works With */}
            <div>
              <h3 className="text-sm font-semibold text-[#5a4a7e] mb-3 text-center uppercase tracking-wider">Also Works With</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {['Gumroad', 'itch.io', 'Booth.pm', 'Unity Asset Store', 'Sketchfab', 'ArtStation', 'Blender Market', '+ Any website'].map((platform) => (
                  <span
                    key={platform}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      platform === '+ Any website'
                        ? 'bg-white/90 text-[#2d1b69] border border-[#cba2ea]/50 shadow-sm'
                        : 'bg-white/70 text-[#4a3a6e]'
                    }`}
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <p className="text-center text-xs text-[#5a4a7e] mt-3 font-medium">
                Request a marketplace and we'll add support! (Not for subscription services like Freepik, Adobe Stock, etc.)
              </p>
            </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors ${
            theme === 'night'
              ? 'bg-white/5 backdrop-blur-lg border border-white/10'
              : 'bg-white'
          }`}>
            <div className="p-8">
            <div className="prose prose-blue max-w-none">

              <h2 className={`text-xl font-semibold mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Our Philosophy</h2>
              <div className={`rounded-xl p-6 mb-6 ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20 border border-white/10'
                  : 'bg-gradient-to-r from-blue-50 to-pink-50 border border-gray-200'
              }`}>
                <p className={`text-base leading-relaxed ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>
                  Assets are like pebbles — collect enough and you can build something amazing. But scattered pebbles? Just a mess.
                </p>
                <p className={`text-base leading-relaxed mt-3 ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>
                  MyPebbles gives your collection structure, so you can stop hoarding and start creating.
                </p>

                {/* Castle */}
                <div className="text-center mt-6">
                  <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${
                    theme === 'night'
                      ? 'bg-gradient-to-r from-[#91d2f4] to-[#cba2ea] bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent'
                  }`}>
                    Go build that castle!
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src="/images/castle.png"
                      alt="Build your castle"
                      className="w-40 h-40 object-contain drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>

              <div className={`border-l-4 p-4 mb-6 ${
                theme === 'night'
                  ? 'bg-[#91d2f4]/20 border-[#91d2f4]'
                  : 'bg-gradient-to-r from-blue-50 to-pink-50 border-blue-500'
              }`}>
                <p className={`text-sm ${
                  theme === 'night' ? 'text-white/80' : 'text-gray-700'
                }`}>
                  <strong>Focus on Organization:</strong> MyPebbles is an asset manager, not a price tracker.
                  Store asset information, organize by project, and never lose track of your collection!
                </p>
              </div>

              <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Auto-Fill Accuracy</h2>
              <p className={`mb-4 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                The browser extension tries its best to automatically extract product information, but it's
                not perfect! Please always double-check:
              </p>

              <div className={`overflow-hidden rounded-lg border mb-4 ${
                theme === 'night' ? 'border-white/10' : 'border-gray-200'
              }`}>
                <table className="w-full">
                  <tbody className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#91d2f4]/10' : 'bg-[#91d2f4]/5'
                      }`}>Creator/Brand name</td>
                      <td className="px-4 py-3">Sometimes sale timers or discount text gets detected</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#91d2f4]/10' : 'bg-[#91d2f4]/5'
                      }`}>Price</td>
                      <td className="px-4 py-3">Make sure original and sale prices are correct</td>
                    </tr>
                    <tr>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#91d2f4]/10' : 'bg-[#91d2f4]/5'
                      }`}>Product title</td>
                      <td className="px-4 py-3">Verify it matches the actual product</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>What Can You Do?</h2>
              <div className={`overflow-hidden rounded-lg border mb-4 ${
                theme === 'night' ? 'border-white/10' : 'border-gray-200'
              }`}>
                <table className="w-full">
                  <tbody className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Wishlist</td>
                      <td className="px-4 py-3">Save assets you want to buy with one click using the browser extension</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Bought</td>
                      <td className="px-4 py-3">Mark assets as purchased and keep track of what you own</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>In Use</td>
                      <td className="px-4 py-3">Tag assets you're actively using in projects</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Projects</td>
                      <td className="px-4 py-3">Create project folders and assign assets to them</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Collections</td>
                      <td className="px-4 py-3">Group assets by creator, style, or any category you want</td>
                    </tr>
                    <tr className={theme === 'night' ? 'border-b border-white/10' : 'border-b border-gray-200'}>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Tags</td>
                      <td className="px-4 py-3">Add custom tags and browse by platform, creator, or your own categories</td>
                    </tr>
                    <tr>
                      <td className={`px-4 py-3 font-semibold ${
                        theme === 'night' ? 'bg-[#cba2ea]/10' : 'bg-[#cba2ea]/5'
                      }`}>Save Info</td>
                      <td className="px-4 py-3">Store prices, thumbnails, creator names, and URLs automatically</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Projects vs Collections FAQ */}
              <div className={`rounded-xl p-6 mt-6 ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20 border border-white/10'
                  : 'bg-gradient-to-r from-blue-50 to-pink-50 border border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>
                  <span>🤔</span> What's the difference between Projects and Collections?
                </h3>
                <p className={`mb-3 ${
                  theme === 'night' ? 'text-white/80' : 'text-gray-600'
                }`}>
                  Honestly? <strong>Nothing!</strong> They work exactly the same way — just different sidebar menus. 😄
                </p>
                <p className={`mb-3 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We recommend using them like this:
                </p>
                <ul className={`list-disc list-inside space-y-2 text-sm ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Projects</strong> — For your webtoon titles, game projects, or any specific creative work you're making</li>
                  <li><strong>Collections</strong> — For categories like "Brushes", a favorite creator/brand, atmospheres like "Cozy Cafe", or asset types like "Dialogue Bubbles"</li>
                </ul>
                <p className={`mt-3 text-sm ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  But really, organize however makes sense to you. Have fun! ✨
                </p>
              </div>

              <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>🔥 ACON3D Sale Detection</h2>
              <p className={`mb-4 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                The extension can check ACON3D's sale page and find which of your wishlist items are currently on sale!
              </p>

              <div className={`rounded-xl p-4 mb-4 ${
                theme === 'night'
                  ? 'bg-[#91d2f4]/10 border border-white/10'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>How it works:</h4>
                <ol className={`list-decimal list-inside space-y-2 text-sm ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li>Click <strong>"Check ACON Sales"</strong> in the extension popup</li>
                  <li>The extension opens ACON3D's sale page and reads the items currently on sale</li>
                  <li>It syncs this list to your MyPebbles account</li>
                  <li>You're redirected to the Sales page, which compares your wishlist against the sale items</li>
                  <li>Matching items show up with their discount! 🎉</li>
                </ol>
              </div>

              <div className={`rounded-xl p-4 mb-4 ${
                theme === 'night'
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                  theme === 'night' ? 'text-yellow-300' : 'text-yellow-700'
                }`}>
                  <span>⚠️</span> Why some items might not match:
                </h4>
                <ul className={`list-disc list-inside space-y-1 text-sm ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Different titles:</strong> The sale page might show "모던 키친" but you saved "Modern Kitchen"</li>
                  <li><strong>Title variations:</strong> Extra words like "3D Model" or "Pack" in one but not the other</li>
                  <li><strong>URL changes:</strong> Product URLs sometimes change over time</li>
                </ul>
                <p className={`text-sm mt-3 ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  💡 <strong>Tip:</strong> If auto-detection misses an item, you can manually mark it as "On Sale" in the Edit modal. It will appear in the Sales page under your platform!
                </p>
              </div>

              <div className={`rounded-xl p-4 mb-6 ${
                theme === 'night'
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                  theme === 'night' ? 'text-green-300' : 'text-green-700'
                }`}>
                  <span>✨</span> Multi-page support:
                </h4>
                <p className={`text-sm ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  The extension automatically reads ALL pages of the ACON3D sale (even when there are 15+ pages!).
                  It runs in the background so you can keep browsing while it syncs.
                </p>
              </div>

              <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Privacy & Data</h2>
              <p className={`mb-4 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                All your data is stored in Firebase and is only accessible to you via your Google account.
                MyPebbles doesn't share your data with anyone or use it for any purpose other than displaying
                your own asset collection to you.
              </p>

              <div className={`rounded-xl p-6 mt-8 ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20'
                  : 'bg-gradient-to-r from-blue-50 to-pink-50'
              }`}>
                <p className={`text-center ${
                  theme === 'night' ? 'text-white' : 'text-gray-700'
                }`}>
                  Made by YuyuKit
                </p>
                <p className={`text-center text-sm mt-2 ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  © melty haeon 2025
                </p>

                {/* Links */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                  <a
                    href="/privacy"
                    className={`hover:underline transition ${
                      theme === 'night' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="mailto:support@pebblz.xyz"
                    className={`hover:underline transition ${
                      theme === 'night' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Contact
                  </a>
                </div>

                {/* Ko-fi Support Button */}
                <div className="flex justify-center mt-4">
                  <a
                    href="https://ko-fi.com/yuyukit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 ${
                      theme === 'night'
                        ? 'bg-[#FF5E5B] hover:bg-[#ff4744] text-white'
                        : 'bg-[#FF5E5B] hover:bg-[#ff4744] text-white'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z"/>
                    </svg>
                    Support on Ko-fi
                  </a>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

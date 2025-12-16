'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Asset, Project, Collection as CollectionType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
      for (const collectionItem of collections) {
        await deleteDoc(doc(db, 'collections', collectionItem.id));
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
                onClick={() => router.push(user ? '/overview' : '/')}
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
              }`}>Privacy Policy</span>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                /* Profile Dropdown */
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
                        onClick={() => {
                          router.push('/tags');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
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
              ) : (
                /* Toggle theme button for logged out users */
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition ${
                    theme === 'night'
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {theme === 'night' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}
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

        <div className="max-w-3xl mx-auto relative z-10">
          <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors ${
            theme === 'night'
              ? 'bg-white/5 backdrop-blur-lg border border-white/10'
              : 'bg-white'
          }`}>
            <div className="p-8">
              <h1 className={`text-3xl font-bold mb-6 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Privacy Policy</h1>

              <p className={`text-sm mb-8 ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>
                Last updated: November 17, 2025
              </p>

              <div className="prose prose-blue max-w-none">
                <h2 className={`text-xl font-semibold mt-6 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>What MyPebbles Is</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles is a personal asset manager for creative digital assets from marketplaces like ACON3D, Clip Studio Paint, Gumroad, and others. It helps you organize what you want to buy, what you've bought, and what you're using in your projects.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>What Data We Collect</h2>

                <h3 className={`text-lg font-semibold mt-6 mb-2 ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>From the Website:</h3>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Google Account Information:</strong> Your name, email, and profile picture when you sign in with Google</li>
                  <li><strong>Asset Data:</strong> Information you save about digital assets (title, price, URL, images, descriptions, tags)</li>
                  <li><strong>Organization Data:</strong> Projects and collections you create to organize your assets</li>
                </ul>

                <h3 className={`text-lg font-semibold mt-6 mb-2 ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>From the Browser Extension:</h3>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Your Settings:</strong> Your Firebase User ID, default status preferences, selected project, and Quick Add toggle setting</li>
                  <li><strong>Page Data:</strong> Asset information extracted from marketplace product pages you choose to save</li>
                  <li><strong>Current Page URL:</strong> To detect which marketplace you're on and whether to show the Quick Add button</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>How We Use Your Data</h2>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li>To display your saved assets back to you</li>
                  <li>To organize your assets by project, collection, and tags</li>
                  <li>To remember your preferences (theme, default status, etc.)</li>
                  <li>To sync your extension settings across your devices</li>
                </ul>

                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <strong>That's it.</strong> We don't analyze your data, sell it, share it with third parties, or use it for advertising.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Where Your Data Is Stored</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  All your data is stored in Google Firebase and is only accessible to you through your Google account. MyPebbles uses Firebase Authentication and Firestore to manage your account and store your assets securely.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Data Sharing</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We don't share your data with anyone. Period.
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li>We don't sell your data</li>
                  <li>We don't share your data with advertisers</li>
                  <li>We don't use your data for marketing</li>
                  <li>We don't track you across other websites</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Your Rights</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  You own your data. You can:
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>View your data:</strong> Everything you save is visible in your dashboard</li>
                  <li><strong>Edit your data:</strong> Update or delete any asset, project, or collection anytime</li>
                  <li><strong>Delete everything:</strong> Use the "Delete All Data" option in your profile menu to permanently remove all your data</li>
                  <li><strong>Sign out anytime:</strong> Your data stays in Firebase but you can disconnect access by signing out</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Browser Extension Permissions</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  The extension requests these permissions:
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>storage:</strong> To save your settings locally in your browser</li>
                  <li><strong>activeTab & tabs:</strong> To detect which marketplace page you're on and extract asset information</li>
                  <li><strong>notifications:</strong> To show success/error notifications when you save assets</li>
                  <li><strong>https://*/*:</strong> To access marketplace websites and extract product data</li>
                </ul>

                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  The extension only activates on recognized marketplace domains. It doesn't collect browsing history, passwords, or personal information beyond what you explicitly save.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Cookies and Tracking</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles uses Firebase Authentication, which sets necessary cookies to keep you signed in. We don't use tracking cookies, analytics, or third-party advertising cookies.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Children's Privacy</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles is not intended for children under 13. We don't knowingly collect data from children.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Changes to This Policy</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  If we make changes to this privacy policy, we'll update the "Last updated" date at the top. Major changes will be announced on the website.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Contact</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Questions about this privacy policy? Reach out at{' '}
                  <a
                    href="mailto:support@pebblz.xyz"
                    className="text-[#2868c6] hover:underline"
                  >
                    support@pebblz.xyz
                  </a>
                </p>

                <div className={`rounded-xl p-6 mt-8 ${
                  theme === 'night'
                    ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20'
                    : 'bg-gradient-to-r from-blue-50 to-pink-50'
                }`}>
                  <p className={`text-center text-sm ${
                    theme === 'night' ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    <strong>TL;DR:</strong> Your data is yours. We store it securely in Firebase, only you can see it, and we don't share it with anyone. You can delete everything anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

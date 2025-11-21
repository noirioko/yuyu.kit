'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { Asset, Project, Collection as CollectionType } from '@/lib/types';
import AddAssetModal from './AddAssetModal';
import EditAssetModal from './EditAssetModal';
import ViewAssetModal from './ViewAssetModal';
import ProjectModal from './ProjectModal';
import EditProjectModal from './EditProjectModal';
import CollectionModal from './CollectionModal';
import EditCollectionModal from './EditCollectionModal';

// Helper to generate consistent color from string
const getColorFromString = (str: string): string => {
  const colors = ['#2868c6', '#cba2ea', '#91d2f4', '#3f3381', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [view, setView] = useState<'all' | 'wishlist' | 'bought'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingCollection, setEditingCollection] = useState<CollectionType | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'duplicate', assetId: string, assetTitle: string, url: string, timestamp: Date}>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{type: 'project' | 'collection', id: string} | null>(null);

  // Click outside to close notifications
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Click outside to close profile menu
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

  // Load notifications from localStorage
  useEffect(() => {
    if (!user) return;

    const storedNotifs = localStorage.getItem(`notifications_${user.uid}`);
    if (storedNotifs) {
      try {
        const parsed = JSON.parse(storedNotifs);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, [user]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!user) return;

    localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
  }, [notifications, user]);

  // Load user data
  useEffect(() => {
    if (!user || !db) return;

    // Subscribe to assets
    const assetsQuery = query(collection(db, 'assets'), where('userId', '==', user.uid));
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastPriceCheck: doc.data().lastPriceCheck?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate(),
        priceHistory: doc.data().priceHistory?.map((p: any) => ({
          ...p,
          checkedAt: p.checkedAt?.toDate()
        })) || []
      })) as Asset[];
      setAssets(assetsData);
    });

    // Subscribe to projects
    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Project[];
      setProjects(projectsData);
    });

    // Subscribe to collections
    const collectionsQuery = query(collection(db, 'collections'), where('userId', '==', user.uid));
    const unsubscribeCollections = onSnapshot(collectionsQuery, (snapshot) => {
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CollectionType[];
      setCollections(collectionsData);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeProjects();
      unsubscribeCollections();
    };
  }, [user]);

  // Filter and sort assets (newest first)
  const filteredAssets = assets
    .filter(asset => {
      if (view !== 'all' && asset.status !== view) return false;
      if (selectedProject && asset.projectId !== selectedProject) return false;
      if (selectedCollection && asset.collectionId !== selectedCollection) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const handleDeleteAsset = async (assetId: string) => {
    if (!db) return;

    try {
      // Find the asset to get its project/collection IDs
      const asset = assets.find(a => a.id === assetId);

      // Delete the asset
      await deleteDoc(doc(db, 'assets', assetId));

      // Decrement project count if asset belonged to a project
      if (asset?.projectId) {
        await updateDoc(doc(db, 'projects', asset.projectId), {
          assetCount: increment(-1)
        });
      }

      // Decrement collection count if asset belonged to a collection
      if (asset?.collectionId) {
        await updateDoc(doc(db, 'collections', asset.collectionId), {
          assetCount: increment(-1)
        });
      }

      setDeletingAssetId(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const handleAutoTagAll = async () => {
    if (!user || !db) return;

    const confirmed = confirm('⚠️ Auto-Tag Warning\n\nGenerally, all added assets have been auto-tagged when you add them, so you don\'t need to auto-tag again.\n\nThis will auto-tag all assets based on their platform and creator fields. Use with caution.\n\nContinue?');
    if (!confirmed) return;

    try {
      console.log('🏷️ Auto-tagging all assets...');
      let updated = 0;

      for (const asset of assets) {
        const newTags = [...(asset.tags || [])];
        let changed = false;

        // Add platform tag if not already present
        if (asset.platform && !newTags.includes(asset.platform)) {
          newTags.push(asset.platform);
          changed = true;
        }

        // Add creator tag if not already present
        if (asset.creator && !newTags.includes(asset.creator)) {
          newTags.push(asset.creator);
          changed = true;
        }

        // Update if tags were added
        if (changed) {
          await updateDoc(doc(db, 'assets', asset.id), {
            tags: newTags,
            updatedAt: Timestamp.now()
          });
          updated++;
          console.log(`✅ Tagged ${asset.title} with:`, newTags);
        }
      }

      console.log(`✅ Auto-tagged ${updated} assets`);
      alert(`Auto-tagging complete!\n\n${updated} assets were updated with tags.`);
    } catch (error) {
      console.error('❌ Error auto-tagging:', error);
      alert('Failed to auto-tag assets. Check console for details.');
    }
  };

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

  // Generate stars only once to prevent re-randomization on every render
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
  }, []); // Empty dependency array means this only runs once

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'night'
        ? 'bg-gradient-to-br from-[#0a1c3d] to-[#101c29]'
        : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 sticky top-0 z-[500] ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#101c29] via-[#0a1c3d] via-[#131f5a] via-[#3f3381] to-[#2868c6] backdrop-blur-lg border-[#2868c6]/30'
          : 'bg-gradient-to-r from-[#91d2f4]/30 via-[#cba2ea]/20 to-[#91d2f4]/30 border-gray-200'
      }`}>
        {/* Stars for night mode */}
        {theme === 'night' && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white animate-pulse"
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
            <div className="flex items-center gap-3">
              <img
                src="/yuyu_mojis/yuwon_veryhappy.png"
                alt="MyPebbles"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className={`text-2xl font-semibold transition-colors ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>MyPebbles</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAutoTagAll}
                className={`text-xs transition ${
                  theme === 'night'
                    ? 'text-white/70 hover:text-[#91d2f4]'
                    : 'text-gray-500 hover:text-[#2868c6]'
                }`}
                title="Auto-tag all assets with platform and creator"
              >
                🏷️ Auto-Tag All
              </button>
              <button
                onClick={() => {
                  if (user?.uid) {
                    navigator.clipboard.writeText(user.uid);
                    alert('User ID copied! Paste it in the browser extension.');
                  }
                }}
                className={`text-xs transition ${
                  theme === 'night'
                    ? 'text-white/70 hover:text-[#91d2f4]'
                    : 'text-gray-500 hover:text-[#2868c6]'
                }`}
                title="Copy User ID for extension"
              >
                📋 Copy User ID
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative transition ${
                    theme === 'night'
                      ? 'text-white hover:text-[#91d2f4]'
                      : 'text-gray-600 hover:text-[#2868c6]'
                  }`}
                  title="Notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    ref={notificationRef}
                    className={`absolute right-0 mt-2 w-96 rounded-xl shadow-lg border py-2 z-[200] max-h-96 overflow-y-auto notification-dropdown ${
                      theme === 'night'
                        ? 'bg-[#0a1c3d] border-white/20'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-2 border-b flex items-center justify-between ${
                      theme === 'night' ? 'border-white/10' : 'border-gray-100'
                    }`}>
                      <h3 className={`text-sm font-semibold ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-[#2868c6] hover:text-[#3f3381]"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className={`px-4 py-8 text-center text-sm ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>
                        No notifications
                      </div>
                    ) : (
                      <div className={`divide-y ${theme === 'night' ? 'divide-white/10' : 'divide-gray-100'}`}>
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 ${theme === 'night' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">⚠️</span>
                              <div className="flex-1">
                                <p className={`text-sm font-medium mb-1 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                                  Duplicate asset detected
                                </p>
                                <p className={`text-sm mb-2 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>
                                  You seem to have already bookmarked this asset
                                </p>
                                <p className="text-sm font-semibold text-[#2868c6] mb-2">
                                  {notif.assetTitle}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const asset = assets.find(a => a.id === notif.assetId);
                                      if (asset) setViewingAsset(asset);
                                      setShowNotifications(false);
                                    }}
                                    className="text-xs px-3 py-1 bg-[#91d2f4]/20 text-[#2868c6] rounded-full hover:bg-[#91d2f4]/30 transition"
                                  >
                                    View Asset
                                  </button>
                                  <button
                                    onClick={() => {
                                      setNotifications(notifications.filter(n => n.id !== notif.id));
                                    }}
                                    className={`text-xs px-3 py-1 rounded-full transition ${
                                      theme === 'night'
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    Dismiss
                                  </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notif.timestamp.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* Sidebar */}
          <aside className="col-span-3">
            <div className={`rounded-xl shadow-sm p-6 transition-all ${
              theme === 'night'
                ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                : 'bg-white'
            }`}>
              {/* View Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 flex-shrink-0 text-[#91d2f4]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="7" cy="7" r="3"/>
                    <circle cx="17" cy="7" r="2.5"/>
                    <circle cx="12" cy="14" r="2"/>
                    <circle cx="6" cy="18" r="2.5"/>
                    <circle cx="18" cy="17" r="3"/>
                  </svg>
                  <h3 className={`text-sm font-semibold ${
                    theme === 'night' ? 'text-white' : 'text-gray-700'
                  }`}>VIEW</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => { setView('all'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      view === 'all' && !selectedProject && !selectedCollection
                        ? theme === 'night'
                          ? 'bg-[#91d2f4]/30 text-white font-medium'
                          : 'bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                        : theme === 'night'
                        ? 'text-white/70 hover:bg-white/5'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="7" cy="7" r="3"/>
                      <circle cx="17" cy="7" r="2.5"/>
                      <circle cx="12" cy="14" r="2"/>
                      <circle cx="6" cy="18" r="2.5"/>
                      <circle cx="18" cy="17" r="3"/>
                    </svg>
                    All Pebbles ({assets.length})
                  </button>
                  <button
                    onClick={() => { setView('wishlist'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      view === 'wishlist' && !selectedProject && !selectedCollection
                        ? theme === 'night'
                          ? 'bg-[#91d2f4]/30 text-white font-medium'
                          : 'bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                        : theme === 'night'
                        ? 'text-white/70 hover:bg-white/5'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="8" cy="9" r="2.5"/>
                      <circle cx="16" cy="8" r="2"/>
                      <circle cx="12" cy="16" r="3"/>
                      <circle cx="18" cy="16" r="2"/>
                    </svg>
                    Wishlist ({assets.filter(a => a.status === 'wishlist').length})
                  </button>
                  <button
                    onClick={() => { setView('bought'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      view === 'bought' && !selectedProject && !selectedCollection
                        ? theme === 'night'
                          ? 'bg-[#91d2f4]/30 text-white font-medium'
                          : 'bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                        : theme === 'night'
                        ? 'text-white/70 hover:bg-white/5'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="6" cy="8" r="2"/>
                      <circle cx="14" cy="7" r="2.5"/>
                      <circle cx="10" cy="15" r="2"/>
                      <circle cx="17" cy="15" r="3"/>
                      <circle cx="7" cy="18" r="2.5"/>
                    </svg>
                    Purchased ({assets.filter(a => a.status === 'bought').length})
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 text-[#2868c6]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <h3 className={`text-sm font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-700'
                    }`}>PROJECTS</h3>
                  </div>
                  <button
                    onClick={() => setShowAddProject(true)}
                    className="text-[#2868c6] hover:text-[#3f3381] text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {projects.map(project => {
                    const projectColor = project.color || getColorFromString(project.name);
                    return (
                      <button
                        key={project.id}
                        onClick={() => { setSelectedProject(project.id); setSelectedCollection(null); setView('all'); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingProject(project);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget({type: 'project', id: project.id});
                        }}
                        onDragLeave={() => {
                          setDragOverTarget(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAsset && db) {
                            updateDoc(doc(db, 'assets', draggedAsset.id), {
                              projectId: project.id,
                              collectionId: null,
                            });
                          }
                          setDragOverTarget(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 relative group ${
                          selectedProject === project.id
                            ? theme === 'night'
                              ? 'bg-[#91d2f4]/30 text-white font-medium'
                              : 'bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                            : dragOverTarget?.type === 'project' && dragOverTarget.id === project.id
                            ? 'bg-[#cba2ea]/30 border-2 border-[#cba2ea] scale-105'
                            : theme === 'night'
                            ? 'text-white/70 hover:bg-white/5'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Right-click to edit"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: projectColor }} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate flex-1">{project.name} ({project.assetCount})</span>
                        <svg
                          className="w-3 h-3 opacity-0 group-hover:opacity-50 transition flex-shrink-0 hover:opacity-100 cursor-pointer"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Collections */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 text-[#cba2ea]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                    </svg>
                    <h3 className={`text-sm font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-700'
                    }`}>COLLECTIONS</h3>
                  </div>
                  <button
                    onClick={() => setShowAddCollection(true)}
                    className="text-[#2868c6] hover:text-[#3f3381] text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {collections.map(collection => {
                    const collectionColor = collection.color || getColorFromString(collection.name);
                    return (
                      <button
                        key={collection.id}
                        onClick={() => { setSelectedCollection(collection.id); setSelectedProject(null); setView('all'); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingCollection(collection);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget({type: 'collection', id: collection.id});
                        }}
                        onDragLeave={() => {
                          setDragOverTarget(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAsset && db) {
                            updateDoc(doc(db, 'assets', draggedAsset.id), {
                              collectionId: collection.id,
                              projectId: null,
                            });
                          }
                          setDragOverTarget(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 relative group ${
                          selectedCollection === collection.id
                            ? theme === 'night'
                              ? 'bg-[#91d2f4]/30 text-white font-medium'
                              : 'bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                            : dragOverTarget?.type === 'collection' && dragOverTarget.id === collection.id
                            ? 'bg-[#cba2ea]/30 border-2 border-[#cba2ea] scale-105'
                            : theme === 'night'
                            ? 'text-white/70 hover:bg-white/5'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Right-click to edit"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: collectionColor }} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate flex-1">{collection.name} ({collection.assetCount})</span>
                        <svg
                          className="w-3 h-3 opacity-0 group-hover:opacity-50 transition flex-shrink-0 hover:opacity-100 cursor-pointer"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCollection(collection);
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Browse by Tags */}
              <div>
                <button
                  onClick={() => router.push('/tags')}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    theme === 'night'
                      ? 'bg-gradient-to-r from-[#91d2f4]/20 to-[#cba2ea]/20 text-[#cba2ea] hover:from-[#91d2f4]/30 hover:to-[#cba2ea]/30'
                      : 'bg-gradient-to-r from-[#91d2f4]/20 to-[#cba2ea]/20 text-[#cba2ea] hover:from-[#91d2f4]/30 hover:to-[#cba2ea]/30'
                  }`}
                >
                  <span>🏷️</span>
                  <span>Browse by Tags</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Assets Grid */}
          <main className="col-span-9">
            <div className="flex items-center justify-between mb-6">
              <h1 className={`text-2xl font-bold flex items-center gap-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>
                {selectedProject ? (
                  <>
                    <svg
                      className="w-6 h-6 flex-shrink-0"
                      style={{ color: projects.find(p => p.id === selectedProject)?.color || getColorFromString(projects.find(p => p.id === selectedProject)?.name || '') }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    {projects.find(p => p.id === selectedProject)?.name}
                  </>
                ) : selectedCollection ? (
                  <>
                    <svg
                      className="w-6 h-6 flex-shrink-0"
                      style={{ color: collections.find(c => c.id === selectedCollection)?.color || getColorFromString(collections.find(c => c.id === selectedCollection)?.name || '') }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    {collections.find(c => c.id === selectedCollection)?.name}
                  </>
                ) : (
                  view === 'all' ? 'All Pebbles' :
                  view === 'wishlist' ? 'Wishlist' : 'Purchased'
                )}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddAsset(true)}
                  className="glitter-hover px-4 py-2 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  + Add Asset
                </button>
              </div>
            </div>

            {/* Quick Overview Summary */}
            {view === 'all' && !selectedProject && !selectedCollection && (
              <div className={`rounded-xl shadow-sm p-4 mb-6 ${
                theme === 'night'
                  ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                  : 'bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 text-[#cba2ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className={`text-lg font-semibold ${
                      theme === 'night' ? 'text-white' : 'text-gray-800'
                    }`}>Quick Overview</h2>
                  </div>
                  <button
                    onClick={() => router.push('/overview')}
                    className={`text-sm font-medium transition ${
                      theme === 'night'
                        ? 'text-[#cba2ea] hover:text-[#91d2f4]'
                        : 'text-[#2868c6] hover:text-[#3f3381]'
                    }`}
                  >
                    View Detailed Overview →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const wishlistCount = assets.filter(a => a.status === 'wishlist').length;
                    const boughtCount = assets.filter(a => a.status === 'bought').length;
                    const totalSpent = assets
                      .filter(a => a.status === 'bought')
                      .reduce((sum, a) => sum + (a.currentPrice || 0), 0);

                    return (
                      <>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'night'
                            ? 'border-white/10 bg-white/5'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-xs mb-1 ${
                            theme === 'night' ? 'text-white/60' : 'text-gray-500'
                          }`}>Wishlist</p>
                          <p className={`text-2xl font-bold ${
                            theme === 'night' ? 'text-white' : 'text-gray-800'
                          }`}>{wishlistCount}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'night'
                            ? 'border-white/10 bg-white/5'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-xs mb-1 ${
                            theme === 'night' ? 'text-white/60' : 'text-gray-500'
                          }`}>Bought</p>
                          <p className={`text-2xl font-bold ${
                            theme === 'night' ? 'text-white' : 'text-gray-800'
                          }`}>{boughtCount}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'night'
                            ? 'border-white/10 bg-white/5'
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-xs mb-1 ${
                            theme === 'night' ? 'text-white/60' : 'text-gray-500'
                          }`}>Total Spent</p>
                          <p className={`text-xl font-bold text-[#cba2ea]`}>
                            ${totalSpent.toFixed(2)}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {filteredAssets.length === 0 ? (
              <div className={`rounded-xl shadow-sm p-12 text-center ${
                theme === 'night'
                  ? 'bg-white/5 backdrop-blur-lg border border-white/10'
                  : 'bg-white'
              }`}>
                <p className={theme === 'night' ? 'text-white/70' : 'text-gray-500'}>No assets yet. Add your first asset!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredAssets.map(asset => (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedAsset(asset);
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      setDraggedAsset(null);
                      setDragOverTarget(null);
                      e.currentTarget.style.opacity = '1';
                    }}
                    className={`rounded-xl shadow-sm overflow-hidden hover:shadow-md transition relative group cursor-move ${
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
                      {/* Edit/Delete buttons - shown on hover */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAsset(asset);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                          title="Edit asset"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingAssetId(asset.id);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition"
                          title="Delete asset"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className={`font-semibold mb-1 truncate ${
                        theme === 'night' ? 'text-white' : 'text-gray-800'
                      }`}>{asset.title}</h3>
                      {/* Folder Badge */}
                      {(asset.projectId || asset.collectionId) && (
                        <div className="flex items-center gap-1 mb-2">
                          <svg
                            className="w-3 h-3 flex-shrink-0"
                            style={{
                              color: asset.projectId
                                ? (projects.find(p => p.id === asset.projectId)?.color || getColorFromString(projects.find(p => p.id === asset.projectId)?.name || ''))
                                : (collections.find(c => c.id === asset.collectionId)?.color || getColorFromString(collections.find(c => c.id === asset.collectionId)?.name || ''))
                            }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <span className={`text-xs ${
                            theme === 'night' ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            {asset.projectId
                              ? projects.find(p => p.id === asset.projectId)?.name
                              : collections.find(c => c.id === asset.collectionId)?.name}
                          </span>
                        </div>
                      )}
                      {asset.creator && (
                        <p className={`text-xs mb-2 ${
                          theme === 'night' ? 'text-white/60' : 'text-gray-600'
                        }`}>by {asset.creator}</p>
                      )}
                      {(asset.currentPrice || asset.currentPrice === 0) && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Show original price with strikethrough if on sale */}
                            {asset.isOnSale && asset.originalPrice && asset.originalPrice > 0 && (
                              <span className="text-sm font-medium text-gray-400" style={{ textDecoration: 'line-through' }}>
                                {asset.currency === 'Gold' || asset.currency === 'Clippy'
                                  ? `${asset.originalPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                                  : `${asset.currency}${asset.originalPrice.toFixed(2)}`}
                              </span>
                            )}
                            {/* Current/Sale price */}
                            <span className={`text-lg font-bold ${
                              asset.currentPrice === 0 || asset.currency?.toLowerCase() === 'free'
                                ? 'text-green-600'
                                : theme === 'night'
                                ? 'text-[#cba2ea]'
                                : 'text-[#2868c6]'
                            }`}>
                              {asset.currentPrice === 0 || asset.currency?.toLowerCase() === 'free'
                                ? 'FREE'
                                : asset.currency === 'Gold' || asset.currency === 'Clippy'
                                ? `${asset.currentPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                                : `${asset.currency}${asset.currentPrice.toFixed(2)}`}
                            </span>
                          </div>
                          {/* Show lowest price if not on sale and current > lowest */}
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
                        <p className="text-xs text-gray-500 mb-2">{asset.platform}</p>
                      )}
                      {asset.fileLocation && (
                        <div className="mb-2 p-2 bg-[#91d2f4]/10 rounded-lg border border-[#91d2f4]/30">
                          <p className="text-xs text-[#2868c6] font-medium mb-1">📁 File Location:</p>
                          <p className="text-xs text-[#3f3381] font-mono break-all">{asset.fileLocation}</p>
                        </div>
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
                        className="text-sm text-[#2868c6] hover:text-[#3f3381] font-medium"
                      >
                        View Online →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showAddAsset && (
        <AddAssetModal
          userId={user!.uid}
          projects={projects}
          collections={collections}
          onClose={() => setShowAddAsset(false)}
        />
      )}
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
      {showAddProject && (
        <ProjectModal
          userId={user!.uid}
          onClose={() => setShowAddProject(false)}
        />
      )}
      {showAddCollection && (
        <CollectionModal
          userId={user!.uid}
          onClose={() => setShowAddCollection(false)}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAssetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Delete Asset?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingAssetId(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAsset(deletingAssetId)}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

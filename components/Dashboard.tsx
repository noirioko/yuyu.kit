'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { Asset, Project, Collection as CollectionType } from '@/lib/types';
import AddAssetModal from './AddAssetModal';
import EditAssetModal from './EditAssetModal';
import ViewAssetModal from './ViewAssetModal';
import ProjectModal from './ProjectModal';
import CollectionModal from './CollectionModal';

export default function Dashboard() {
  const { user, signOut } = useAuth();
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
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'duplicate', assetId: string, assetTitle: string, url: string, timestamp: Date}>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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


  const handleCheckPrices = async () => {
    if (!user || !db) return;

    setCheckingPrices(true);
    try {
      console.log('🔍 Starting price check...');

      const response = await fetch('/api/check-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      const result = await response.json();

      if (result.success) {
        const { checked, updated, onSale, errors } = result.results;

        let message = `Price check complete!\n\n`;
        message += `✓ Checked: ${checked} assets\n`;
        if (updated > 0) message += `📊 Updated: ${updated} prices\n`;
        if (onSale > 0) message += `🎉 On sale: ${onSale} items\n`;
        if (errors > 0) message += `❌ Errors: ${errors}\n`;

        // Show sales details if any
        const sales = result.results.details.filter((d: any) => d.status === 'sale');
        if (sales.length > 0) {
          message += `\nSales found:\n`;
          sales.forEach((sale: any) => {
            message += `• ${sale.title}: ${sale.discount}% off!\n`;
          });
        }

        alert(message);
        console.log('✅ Price check results:', result.results);
      } else {
        throw new Error(result.error || 'Failed to check prices');
      }
    } catch (error) {
      console.error('❌ Error checking prices:', error);
      alert(`Failed to check prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCheckingPrices(false);
    }
  };

  const handleAutoTagAll = async () => {
    if (!user || !db) return;

    const confirmed = confirm('This will auto-tag all assets based on their platform and creator fields. Continue?');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/yuyu_mojis/yuwon_veryhappy.png"
                alt="YuyuAsset"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="text-2xl font-semibold text-gray-800">YuyuAsset</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAutoTagAll}
                className="text-xs text-gray-500 hover:text-indigo-600 transition"
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
                className="text-xs text-gray-500 hover:text-indigo-600 transition"
                title="Copy User ID for extension"
              >
                📋 Copy User ID
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-gray-600 hover:text-indigo-600 transition"
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
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">⚠️</span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 font-medium mb-1">
                                  Duplicate asset detected
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  You seem to have already bookmarked this asset
                                </p>
                                <p className="text-sm font-semibold text-indigo-600 mb-2">
                                  {notif.assetTitle}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const asset = assets.find(a => a.id === notif.assetId);
                                      if (asset) setViewingAsset(asset);
                                      setShowNotifications(false);
                                    }}
                                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition"
                                  >
                                    View Asset
                                  </button>
                                  <button
                                    onClick={() => {
                                      setNotifications(notifications.filter(n => n.id !== notif.id));
                                    }}
                                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.displayName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        router.push('/about');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition flex items-center gap-2"
                    >
                      <span>ℹ️</span>
                      <span>About</span>
                    </button>

                    <button
                      onClick={() => {
                        router.push('/tags');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition flex items-center gap-2"
                    >
                      <span>🏷️</span>
                      <span>Browse Tags</span>
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={() => {
                        handleDeleteAllData();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      <span>Delete All Data</span>
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <span>👋</span>
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* View Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">VIEW</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { setView('all'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      view === 'all' && !selectedProject && !selectedCollection
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Assets ({assets.length})
                  </button>
                  <button
                    onClick={() => { setView('wishlist'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      view === 'wishlist' && !selectedProject && !selectedCollection
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Wishlist ({assets.filter(a => a.status === 'wishlist').length})
                  </button>
                  <button
                    onClick={() => { setView('bought'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      view === 'bought' && !selectedProject && !selectedCollection
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Purchased ({assets.filter(a => a.status === 'bought').length})
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">PROJECTS</h3>
                  <button
                    onClick={() => setShowAddProject(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => { setSelectedProject(project.id); setSelectedCollection(null); setView('all'); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedProject === project.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {project.name} ({project.assetCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* Collections */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">COLLECTIONS</h3>
                  <button
                    onClick={() => setShowAddCollection(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {collections.map(collection => (
                    <button
                      key={collection.id}
                      onClick={() => { setSelectedCollection(collection.id); setSelectedProject(null); setView('all'); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedCollection === collection.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {collection.name} ({collection.assetCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse by Tags */}
              <div>
                <button
                  onClick={() => router.push('/tags')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 rounded-lg font-medium hover:from-indigo-200 hover:to-violet-200 transition flex items-center justify-center gap-2"
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
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedProject
                  ? projects.find(p => p.id === selectedProject)?.name
                  : selectedCollection
                  ? collections.find(c => c.id === selectedCollection)?.name
                  : view === 'all'
                  ? 'All Assets'
                  : view === 'wishlist'
                  ? 'Wishlist'
                  : 'Purchased'}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddAsset(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  + Add Asset
                </button>
              </div>
            </div>

            {filteredAssets.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500">No assets yet. Add your first asset!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredAssets.map(asset => (
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

                    <div className="aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden">
                      {asset.thumbnailUrl ? (
                        <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <h3 className="font-semibold text-gray-800 mb-1 truncate">{asset.title}</h3>
                      {asset.creator && (
                        <p className="text-xs text-gray-600 mb-2">by {asset.creator}</p>
                      )}
                      {asset.currentPrice && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Show original price with strikethrough if on sale */}
                            {asset.isOnSale && asset.originalPrice && (
                              <span className="text-sm font-medium text-gray-400" style={{ textDecoration: 'line-through' }}>
                                {asset.currency}{asset.originalPrice.toFixed(2)}
                              </span>
                            )}
                            {/* Current/Sale price */}
                            <span className={`text-lg font-bold ${asset.isOnSale ? 'text-red-600' : 'text-indigo-600'}`}>
                              {asset.currency}{asset.currentPrice.toFixed(2)}
                            </span>
                          </div>
                          {/* Show lowest price if not on sale and current > lowest */}
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
                      {asset.fileLocation && (
                        <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">📁 File Location:</p>
                          <p className="text-xs text-blue-900 font-mono break-all">{asset.fileLocation}</p>
                        </div>
                      )}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {asset.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700"
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
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
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

  const fixAllCounts = async () => {
    if (!db || !user) return;

    const confirmed = confirm('This will recalculate all project and collection counts. Continue?');
    if (!confirmed) return;

    try {
      console.log('🔧 Fixing all counts...');

      // Count assets per project
      const projectCounts: Record<string, number> = {};
      const collectionCounts: Record<string, number> = {};

      assets.forEach(asset => {
        if (asset.projectId) {
          projectCounts[asset.projectId] = (projectCounts[asset.projectId] || 0) + 1;
        }
        if (asset.collectionId) {
          collectionCounts[asset.collectionId] = (collectionCounts[asset.collectionId] || 0) + 1;
        }
      });

      // Update all projects
      for (const project of projects) {
        const correctCount = projectCounts[project.id] || 0;
        if (project.assetCount !== correctCount) {
          console.log(`Fixing ${project.name}: ${project.assetCount} → ${correctCount}`);
          await updateDoc(doc(db, 'projects', project.id), {
            assetCount: correctCount
          });
        }
      }

      // Update all collections
      for (const collection of collections) {
        const correctCount = collectionCounts[collection.id] || 0;
        if (collection.assetCount !== correctCount) {
          console.log(`Fixing ${collection.name}: ${collection.assetCount} → ${correctCount}`);
          await updateDoc(doc(db, 'collections', collection.id), {
            assetCount: correctCount
          });
        }
      }

      console.log('✅ All counts fixed!');
      alert('Counts have been fixed!');
    } catch (error) {
      console.error('Error fixing counts:', error);
      alert('Failed to fix counts. Check console for details.');
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
                onClick={fixAllCounts}
                className="text-xs text-gray-500 hover:text-purple-600 transition"
                title="Fix project/collection counts"
              >
                🔧 Fix Counts
              </button>
              <button
                onClick={handleAutoTagAll}
                className="text-xs text-gray-500 hover:text-purple-600 transition"
                title="Auto-tag all assets with platform and creator"
              >
                🏷️ Auto-Tag All
              </button>
              <button
                onClick={handleCheckPrices}
                disabled={checkingPrices}
                className="text-xs text-gray-500 hover:text-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Check prices for all assets"
              >
                {checkingPrices ? '⏳ Checking...' : '💰 Check Prices'}
              </button>
              <button
                onClick={() => {
                  if (user?.uid) {
                    navigator.clipboard.writeText(user.uid);
                    alert('User ID copied! Paste it in the browser extension.');
                  }
                }}
                className="text-xs text-gray-500 hover:text-purple-600 transition"
                title="Copy User ID for extension"
              >
                📋 Copy User ID
              </button>
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
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Assets ({assets.length})
                  </button>
                  <button
                    onClick={() => { setView('wishlist'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      view === 'wishlist' && !selectedProject && !selectedCollection
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Wishlist ({assets.filter(a => a.status === 'wishlist').length})
                  </button>
                  <button
                    onClick={() => { setView('bought'); setSelectedProject(null); setSelectedCollection(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      view === 'bought' && !selectedProject && !selectedCollection
                        ? 'bg-purple-50 text-purple-700 font-medium'
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
                    className="text-purple-600 hover:text-purple-700 text-xl"
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
                          ? 'bg-purple-50 text-purple-700 font-medium'
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
                    className="text-purple-600 hover:text-purple-700 text-xl"
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
                          ? 'bg-purple-50 text-purple-700 font-medium'
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
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg font-medium hover:from-purple-200 hover:to-pink-200 transition flex items-center justify-center gap-2"
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
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition"
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

                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                      {asset.thumbnailUrl ? (
                        <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <span className={`text-lg font-bold ${asset.isOnSale ? 'text-red-600' : 'text-purple-600'}`}>
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
                              className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700"
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
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
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

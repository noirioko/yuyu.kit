'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Project, Collection } from '@/lib/types';

interface AddAssetModalProps {
  userId: string;
  projects: Project[];
  collections: Collection[];
  onClose: () => void;
}

export default function AddAssetModal({ userId, projects, collections, onClose }: AddAssetModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('$');
  const [platform, setPlatform] = useState('');
  const [projectId, setProjectId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [status, setStatus] = useState<'wishlist' | 'bought' | 'in-use'>('wishlist');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [fileLocation, setFileLocation] = useState('');

  const handleFetchInfo = async () => {
    if (!url) {
      alert('Please enter a URL first');
      return;
    }

    console.log('🔍 Starting auto-fill for URL:', url);
    setFetching(true);
    try {
      console.log('📡 Calling /api/scrape...');
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);

      if (result.success && result.data) {
        console.log('✅ Success! Filling form with:', result.data);
        setTitle(result.data.title || '');
        setDescription(result.data.description || '');
        setPrice(result.data.price ? String(result.data.price) : '');
        setCurrency(result.data.currency || '$');
        setPlatform(result.data.platform || '');
        setThumbnailUrl(result.data.thumbnailUrl || '');
      } else {
        console.error('❌ Failed:', result.error || 'Unknown error');
        alert(`Could not fetch asset info: ${result.error || 'Unknown error'}\n\nPlease fill manually.`);
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      alert('Failed to fetch asset info. Please fill manually.');
    } finally {
      setFetching(false);
      console.log('🏁 Auto-fill completed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title || !db) return;

    setLoading(true);
    try {
      const now = Timestamp.now();
      const priceValue = price ? parseFloat(price) : null;

      await addDoc(collection(db, 'assets'), {
        userId,
        url,
        title,
        description,
        thumbnailUrl: thumbnailUrl || null,
        currentPrice: priceValue,
        currency,
        platform,
        fileLocation: fileLocation || null,
        projectId: projectId || null,
        collectionId: collectionId || null,
        status,
        tags: [],
        priceHistory: priceValue ? [{
          price: priceValue,
          currency,
          checkedAt: now
        }] : [],
        lowestPrice: priceValue,
        lastPriceCheck: priceValue ? now : null,
        createdAt: now,
        updatedAt: now,
      });

      // Increment project count if asset is added to a project
      if (projectId) {
        await updateDoc(doc(db, 'projects', projectId), {
          assetCount: increment(1)
        });
      }

      // Increment collection count if asset is added to a collection
      if (collectionId) {
        await updateDoc(doc(db, 'collections', collectionId), {
          assetCount: increment(1)
        });
      }

      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('Failed to add asset. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        {/* X Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Add New Asset</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset URL *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://acon3d.com/..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                required
              />
              <button
                type="button"
                onClick={handleFetchInfo}
                disabled={fetching || !url}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {fetching ? 'Fetching...' : '✨ Auto-Fill'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Paste a URL and click Auto-Fill to automatically detect title, price, and image</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Modern Kitchen 3D Model"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this asset..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
                <option value="¥">¥ JPY</option>
                <option value="₩">₩ KRW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="ACON3D, Gumroad, ArtStation..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Location
            </label>
            <input
              type="text"
              value={fileLocation}
              onChange={(e) => setFileLocation(e.target.value)}
              placeholder="C:\Assets\3D Models\Kitchen.blend"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Where you saved this file on your computer (optional)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="">None</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              >
                <option value="">None</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('wishlist')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  status === 'wishlist'
                    ? 'border-[#2868c6] bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Wishlist
              </button>
              <button
                type="button"
                onClick={() => setStatus('bought')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  status === 'bought'
                    ? 'border-[#2868c6] bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Purchased
              </button>
              <button
                type="button"
                onClick={() => setStatus('in-use')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  status === 'in-use'
                    ? 'border-[#2868c6] bg-[#91d2f4]/20 text-[#2868c6] font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                In Use
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

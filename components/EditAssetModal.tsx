'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { Asset, Project, Collection } from '@/lib/types';

interface EditAssetModalProps {
  asset: Asset;
  projects: Project[];
  collections: Collection[];
  onClose: () => void;
}

export default function EditAssetModal({ asset, projects, collections, onClose }: EditAssetModalProps) {
  const [url, setUrl] = useState(asset.url);
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  // If on sale, show original price; otherwise show current price
  const [price, setPrice] = useState(
    asset.isOnSale && asset.originalPrice
      ? String(asset.originalPrice)
      : (asset.currentPrice ? String(asset.currentPrice) : '')
  );
  const [currency, setCurrency] = useState(asset.currency || '$');
  const [platform, setPlatform] = useState(asset.platform || '');
  const [creator, setCreator] = useState(asset.creator || '');
  const [projectId, setProjectId] = useState(asset.projectId || '');
  const [collectionId, setCollectionId] = useState(asset.collectionId || '');
  const [status, setStatus] = useState<'wishlist' | 'bought' | 'in-use'>(asset.status);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(asset.thumbnailUrl || '');
  const [fileLocation, setFileLocation] = useState(asset.fileLocation || '');
  const [personalNotes, setPersonalNotes] = useState(asset.personalNotes || '');
  const [personalRating, setPersonalRating] = useState(asset.personalRating || 0);
  const [tags, setTags] = useState<string[]>(asset.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isOnSale, setIsOnSale] = useState(asset.isOnSale || false);
  // Calculate discount percent from original and current price if available
  const initialDiscount = asset.isOnSale && asset.originalPrice && asset.currentPrice
    ? Math.round((1 - asset.currentPrice / asset.originalPrice) * 100)
    : 20;
  const [discountPercent, setDiscountPercent] = useState(initialDiscount);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

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

      // Calculate original and current prices first
      const originalPriceValue = price ? parseFloat(price) : null;
      // If on sale, calculate the sale price from discount; otherwise use price as current price
      const currentPriceValue = isOnSale && originalPriceValue
        ? originalPriceValue * (1 - discountPercent / 100)
        : originalPriceValue;

      // Check if price changed, and update price history if so
      const priceHistory = [...asset.priceHistory];
      let lowestPrice = asset.lowestPrice;

      if (currentPriceValue !== null && currentPriceValue !== asset.currentPrice) {
        priceHistory.push({
          price: currentPriceValue,
          currency,
          checkedAt: now.toDate()
        });

        if (!lowestPrice || currentPriceValue < lowestPrice) {
          lowestPrice = currentPriceValue;
        }
      }

      const updateData = {
        url,
        title,
        description,
        thumbnailUrl: thumbnailUrl || null,
        currentPrice: currentPriceValue,
        originalPrice: isOnSale ? originalPriceValue : null,
        isOnSale,
        currency,
        platform,
        creator: creator || '',
        fileLocation: fileLocation || null,
        projectId: projectId || null,
        collectionId: collectionId || null,
        status,
        personalNotes: personalNotes || '',
        personalRating: personalRating || 0,
        tags,
        priceHistory,
        lowestPrice,
        lastPriceCheck: currentPriceValue ? now : (asset.lastPriceCheck || null),
        updatedAt: now,
      };

      console.log('🔄 Updating asset with data:', updateData);
      await updateDoc(doc(db, 'assets', asset.id), updateData);
      console.log('✅ Asset updated successfully');

      // Update project counts if project changed
      const oldProjectId = asset.projectId;
      const newProjectId = projectId || null;

      if (oldProjectId !== newProjectId) {
        console.log(`📊 Project changed from ${oldProjectId} to ${newProjectId}`);

        // Decrement old project count
        if (oldProjectId) {
          console.log(`➖ Decrementing count for old project ${oldProjectId}`);
          await updateDoc(doc(db, 'projects', oldProjectId), {
            assetCount: increment(-1)
          });
        }

        // Increment new project count
        if (newProjectId) {
          console.log(`➕ Incrementing count for new project ${newProjectId}`);
          await updateDoc(doc(db, 'projects', newProjectId), {
            assetCount: increment(1)
          });
        }
      }

      // Update collection counts if collection changed
      const oldCollectionId = asset.collectionId;
      const newCollectionId = collectionId || null;

      if (oldCollectionId !== newCollectionId) {
        console.log(`📊 Collection changed from ${oldCollectionId} to ${newCollectionId}`);

        // Decrement old collection count
        if (oldCollectionId) {
          console.log(`➖ Decrementing count for old collection ${oldCollectionId}`);
          await updateDoc(doc(db, 'collections', oldCollectionId), {
            assetCount: increment(-1)
          });
        }

        // Increment new collection count
        if (newCollectionId) {
          console.log(`➕ Incrementing count for new collection ${newCollectionId}`);
          await updateDoc(doc(db, 'collections', newCollectionId), {
            assetCount: increment(1)
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('❌ Error updating asset:', error);
      alert('Failed to update asset. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        {/* X Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110 cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Edit Asset</h2>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
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

          {/* Sale toggle and discount dropdown */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnSale}
                onChange={(e) => setIsOnSale(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">🏷️ On Sale?</span>
            </label>
            {isOnSale && (
              <>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 text-sm"
                >
                  <option value={10}>10% off</option>
                  <option value={15}>15% off</option>
                  <option value={20}>20% off</option>
                  <option value={25}>25% off</option>
                  <option value={30}>30% off</option>
                  <option value={40}>40% off</option>
                  <option value={50}>50% off</option>
                  <option value={60}>60% off</option>
                  <option value={70}>70% off</option>
                  <option value={75}>75% off</option>
                  <option value={80}>80% off</option>
                  <option value={90}>90% off</option>
                </select>
                {price && (
                  <span className="text-sm text-green-600 font-medium">
                    Sale: {currency}{(parseFloat(price) * (1 - discountPercent / 100)).toFixed(2)}
                  </span>
                )}
              </>
            )}
          </div>
          {isOnSale && (
            <p className="text-xs text-gray-500 -mt-2">
              💡 Price above is the original price. Sale price will be calculated automatically.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="ACON3D, Gumroad..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator / Brand
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Blue Moon, Gekiryostudio..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
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
                className={`flex-1 py-2 rounded-lg border-2 transition cursor-pointer ${
                  status === 'wishlist'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Wishlist
              </button>
              <button
                type="button"
                onClick={() => setStatus('bought')}
                className={`flex-1 py-2 rounded-lg border-2 transition cursor-pointer ${
                  status === 'bought'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Bought
              </button>
              <button
                type="button"
                onClick={() => setStatus('in-use')}
                className={`flex-1 py-2 rounded-lg border-2 transition cursor-pointer ${
                  status === 'in-use'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                In Use
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              {/* Display existing tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-purple-500 hover:text-purple-700 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add new tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag (press Enter)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium cursor-pointer"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Tags like "{platform}", "{creator}", "3D model", "texture", etc.
              </p>
            </div>
          </div>

          {/* Personal Rating - only for bought assets */}
          {status === 'bought' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPersonalRating(star)}
                    className="text-3xl focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    {star <= personalRating ? '⭐' : '☆'}
                  </button>
                ))}
                {personalRating > 0 && (
                  <button
                    type="button"
                    onClick={() => setPersonalRating(0)}
                    className="ml-2 text-xs text-gray-500 hover:text-red-600 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {status === 'wishlist' ? 'Why do you want this?' : status === 'bought' ? 'Your Review' : 'Your Thoughts'}
            </label>
            <textarea
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder={
                status === 'wishlist'
                  ? 'Why do you want this asset? What project would you use it for?'
                  : status === 'bought'
                  ? 'How was the quality? Would you recommend it? How did you use it?'
                  : 'Notes about this asset...'
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

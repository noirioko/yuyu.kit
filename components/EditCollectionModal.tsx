'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, Timestamp, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Collection as CollectionType } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface EditCollectionModalProps {
  collection: CollectionType;
  onClose: () => void;
}

export default function EditCollectionModal({ collection: collectionData, onClose }: EditCollectionModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(collectionData.name);
  const [description, setDescription] = useState(collectionData.description || '');
  const [platform, setPlatform] = useState(collectionData.platform || '');
  const [customPlatform, setCustomPlatform] = useState('');
  const [color, setColor] = useState(collectionData.color || '#cba2ea');
  const [loading, setLoading] = useState(false);

  const platforms = [
    'ACON3D',
    'CSP Asset',
    'Amazon co jp',
    'VGEN',
    'Other'
  ];

  const colors = [
    '#2868c6', // Cosmic Blue
    '#cba2ea', // Stardust Purple
    '#91d2f4', // Nebula Sky
    '#3f3381', // Mystic Violet
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !db) return;

    setLoading(true);
    try {
      const finalPlatform = platform === 'Other' ? customPlatform : platform;
      await updateDoc(doc(db, 'collections', collectionData.id), {
        name,
        description,
        platform: finalPlatform,
        color,
        updatedAt: Timestamp.now(),
      });

      onClose();
    } catch (error: any) {
      console.error('Error updating collection:', error);
      alert(`Failed to update collection: ${error.message}`);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!db) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${collectionData.name}"?\n\n` +
      `This will not delete the ${collectionData.assetCount} asset(s) in this collection, ` +
      `but will remove them from the collection.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      // Remove collection reference from all assets
      const assetsQuery = query(
        collection(db, 'assets'),
        where('collectionId', '==', collectionData.id)
      );
      const assetsSnapshot = await getDocs(assetsQuery);

      const batch = writeBatch(db);
      assetsSnapshot.docs.forEach(assetDoc => {
        batch.update(assetDoc.ref, { collectionId: null });
      });
      await batch.commit();

      // Delete the collection
      await deleteDoc(doc(db, 'collections', collectionData.id));

      onClose();
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      alert(`Failed to delete collection: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl max-w-md w-full transition-colors ${
          theme === 'night'
            ? 'bg-[#0a1c3d]/95 backdrop-blur-xl border border-white/20'
            : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 rounded-full p-2 shadow-lg transition-all hover:scale-110 ${
            theme === 'night'
              ? 'bg-white/10 hover:bg-white/20 backdrop-blur-lg'
              : 'bg-white/90 hover:bg-white'
          }`}
          aria-label="Close"
        >
          <svg className={`w-5 h-5 ${theme === 'night' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={`p-6 border-b ${theme === 'night' ? 'border-white/10' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
            Edit Collection
          </h2>
          <p className={`text-sm mt-1 ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>
            Track assets by creator or store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'night' ? 'text-white' : 'text-gray-700'
            }`}>
              Collection Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Creator name or store..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2868c6] focus:border-transparent transition ${
                theme === 'night'
                  ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'night' ? 'text-white' : 'text-gray-700'
            }`}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2868c6] focus:border-transparent transition ${
                theme === 'night'
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select platform...</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {platform === 'Other' && (
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Enter custom platform name..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2868c6] focus:border-transparent transition mt-2 ${
                  theme === 'night'
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'night' ? 'text-white' : 'text-gray-700'
            }`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this collection..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2868c6] focus:border-transparent transition ${
                theme === 'night'
                  ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'night' ? 'text-white' : 'text-gray-700'
            }`}>
              Folder Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition ${
                    color === c ? 'ring-2 ring-offset-2 ring-[#2868c6]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className={`flex-1 py-3 border rounded-lg transition font-medium ${
                theme === 'night'
                  ? 'border-red-400/50 text-red-400 hover:bg-red-400/10'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              }`}
              disabled={loading}
            >
              Delete
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
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

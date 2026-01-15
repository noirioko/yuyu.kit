'use client';

import { Asset } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface ViewAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ViewAssetModal({ asset, onClose, onEdit, onDelete }: ViewAssetModalProps) {
  const { theme } = useTheme();
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative modal-content transition-colors ${
          theme === 'night'
            ? 'bg-[#0a1c3d]/95 backdrop-blur-xl border border-white/20'
            : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 rounded-full p-2 shadow-lg transition-all hover:scale-110 cursor-pointer ${
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

        {/* Header with Image */}
        <div className="relative">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.title}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 flex items-center justify-center rounded-t-2xl">
              <svg className="w-24 h-24 text-[#91d2f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Status Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
            asset.status === 'wishlist' ? 'bg-yellow-500 text-white' :
            asset.status === 'bought' ? 'bg-green-500 text-white' :
            'bg-[#2868c6] text-white'
          }`}>
            {asset.status === 'wishlist' ? '📌 Wishlist' :
             asset.status === 'bought' ? '✅ Bought' :
             '🎨 In Use'}
          </div>
          {/* Sale Badge */}
          {asset.isOnSale && asset.originalPrice && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              -{Math.round((1 - asset.currentPrice! / asset.originalPrice) * 100)}% OFF
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Title */}
          <h2 className={`text-3xl font-bold mb-2 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>{asset.title}</h2>

          {/* Creator */}
          {asset.creator && (
            <p className={`text-lg mb-4 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>by {asset.creator}</p>
          )}

          {/* Platform */}
          {asset.platform && (
            <p className={`text-sm mb-4 ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>🏪 {asset.platform}</p>
          )}

          {/* Price */}
          {(asset.currentPrice || asset.currentPrice === 0) && (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                {asset.isOnSale && asset.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {asset.currency === 'Free'
                      ? 'FREE'
                      : asset.currency === 'Gold' || asset.currency === 'Clippy'
                      ? `${asset.originalPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                      : `${asset.currency}${asset.originalPrice.toFixed(2)}`}
                  </span>
                )}
                <span className={`text-3xl font-bold ${
                  asset.currentPrice === 0
                    ? 'text-green-600'
                    : theme === 'night'
                    ? 'text-[#cba2ea]'
                    : 'text-[#2868c6]'
                }`}>
                  {asset.currency === 'Free' || asset.currentPrice === 0
                    ? 'FREE'
                    : asset.currency === 'Gold' || asset.currency === 'Clippy'
                    ? `${asset.currentPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                    : `${asset.currency}${asset.currentPrice.toFixed(2)}`}
                </span>
              </div>
              {asset.lowestPrice && asset.lowestPrice > 0 && asset.currentPrice > asset.lowestPrice && !asset.isOnSale && (
                <p className={`text-sm mt-2 ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>
                  💰 Lowest price seen: {asset.currency === 'Free'
                    ? 'FREE'
                    : asset.currency === 'Gold' || asset.currency === 'Clippy'
                    ? `${asset.lowestPrice.toFixed(0)} ${asset.currency.toUpperCase()}`
                    : `${asset.currency}${asset.lowestPrice.toFixed(2)}`}
                </p>
              )}
            </div>
          )}

          {/* Personal Rating */}
          {asset.status === 'bought' && asset.personalRating && asset.personalRating > 0 && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-1 ${theme === 'night' ? 'text-white' : 'text-gray-700'}`}>Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-2xl">
                    {star <= asset.personalRating! ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {asset.personalNotes && (
            <div className={`mb-4 p-4 rounded-lg border ${
              theme === 'night'
                ? 'bg-[#cba2ea]/20 border-[#cba2ea]/40'
                : 'bg-[#cba2ea]/10 border-[#cba2ea]/30'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'night' ? 'text-[#cba2ea]' : 'text-[#3f3381]'
              }`}>
                {asset.status === 'wishlist' ? '💭 Why you want this' :
                 asset.status === 'bought' ? '📝 Your Review' :
                 '💭 Your Thoughts'}
              </p>
              <p className={theme === 'night' ? 'text-white/80' : 'text-gray-700'}>{asset.personalNotes}</p>
            </div>
          )}

          {/* Description */}
          {asset.description && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-1 ${theme === 'night' ? 'text-white' : 'text-gray-700'}`}>Description</p>
              <p className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>{asset.description}</p>
            </div>
          )}

          {/* File Location */}
          {asset.fileLocation && (
            <div className={`mb-4 p-3 rounded-lg border ${
              theme === 'night'
                ? 'bg-[#91d2f4]/20 border-[#91d2f4]/40'
                : 'bg-[#91d2f4]/10 border-[#91d2f4]/30'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                theme === 'night' ? 'text-[#91d2f4]' : 'text-[#2868c6]'
              }`}>📁 File Location</p>
              <p className={`text-sm font-mono break-all ${
                theme === 'night' ? 'text-white/80' : 'text-[#3f3381]'
              }`}>{asset.fileLocation}</p>
            </div>
          )}

          {/* Link */}
          <div className="mb-6">
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 font-medium ${
                theme === 'night'
                  ? 'text-[#cba2ea] hover:text-[#91d2f4]'
                  : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              View on {asset.platform || 'Marketplace'} →
            </a>
          </div>

          {/* Price History */}
          {asset.priceHistory && asset.priceHistory.length > 1 && (
            <div className="mb-6">
              <p className={`text-sm font-medium mb-2 ${theme === 'night' ? 'text-white' : 'text-gray-700'}`}>📊 Price History</p>
              <div className="space-y-2">
                {asset.priceHistory.slice(-5).reverse().map((point, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className={theme === 'night' ? 'text-white/70' : 'text-gray-600'}>
                      {point.checkedAt instanceof Date ? point.checkedAt.toLocaleDateString() : new Date(point.checkedAt).toLocaleDateString()}
                    </span>
                    <span className={`font-medium ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                      {point.currency}{point.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onDelete}
              className={`flex-1 py-3 border rounded-lg transition font-medium cursor-pointer ${
                theme === 'night'
                  ? 'border-red-400/50 text-red-400 hover:bg-red-400/10'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              }`}
            >
              🗑️ Delete
            </button>
            <button
              onClick={onEdit}
              className="flex-1 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg font-medium hover:shadow-lg transition cursor-pointer"
            >
              ✏️ Edit Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

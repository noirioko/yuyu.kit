'use client';

import { Asset } from '@/lib/types';

interface ViewAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onEdit: () => void;
}

export default function ViewAssetModal({ asset, onClose, onEdit }: ViewAssetModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Image */}
        <div className="relative">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.title}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center rounded-t-2xl">
              <svg className="w-24 h-24 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Status Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
            asset.status === 'wishlist' ? 'bg-yellow-500 text-white' :
            asset.status === 'bought' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{asset.title}</h2>

          {/* Creator */}
          {asset.creator && (
            <p className="text-lg text-gray-600 mb-4">by {asset.creator}</p>
          )}

          {/* Platform */}
          {asset.platform && (
            <p className="text-sm text-gray-500 mb-4">🏪 {asset.platform}</p>
          )}

          {/* Price */}
          {asset.currentPrice && (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                {asset.isOnSale && asset.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {asset.currency}{asset.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className={`text-3xl font-bold ${asset.isOnSale ? 'text-red-600' : 'text-purple-600'}`}>
                  {asset.currency}{asset.currentPrice.toFixed(2)}
                </span>
              </div>
              {asset.lowestPrice && asset.currentPrice > asset.lowestPrice && !asset.isOnSale && (
                <p className="text-sm text-gray-500 mt-2">
                  💰 Lowest price seen: {asset.currency}{asset.lowestPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Personal Rating */}
          {asset.status === 'bought' && asset.personalRating && asset.personalRating > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Your Rating</p>
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
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-700 mb-2">
                {asset.status === 'wishlist' ? '💭 Why you want this' :
                 asset.status === 'bought' ? '📝 Your Review' :
                 '💭 Your Thoughts'}
              </p>
              <p className="text-gray-700">{asset.personalNotes}</p>
            </div>
          )}

          {/* Description */}
          {asset.description && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-gray-600">{asset.description}</p>
            </div>
          )}

          {/* File Location */}
          {asset.fileLocation && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-1">📁 File Location</p>
              <p className="text-sm text-blue-900 font-mono break-all">{asset.fileLocation}</p>
            </div>
          )}

          {/* Link */}
          <div className="mb-6">
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              View on {asset.platform || 'Marketplace'} →
            </a>
          </div>

          {/* Price History */}
          {asset.priceHistory && asset.priceHistory.length > 1 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">📊 Price History</p>
              <div className="space-y-2">
                {asset.priceHistory.slice(-5).reverse().map((point, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {point.checkedAt instanceof Date ? point.checkedAt.toLocaleDateString() : new Date(point.checkedAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-gray-800">
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
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition"
            >
              ✏️ Edit Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

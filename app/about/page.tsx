'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/yuyu_mojis/yuwon_veryhappy.png"
                alt="MyPebbles"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="text-2xl font-semibold text-gray-800">MyPebbles</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
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
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">About MyPebbles</h1>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">What is MyPebbles?</h2>
              <p className="text-gray-600 mb-4">
                MyPebbles is your personal digital asset library for managing ACON3D, CSP, and other marketplace assets.
                Keep track of what you want to buy, what you've already bought, and organize everything by project!
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-pink-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>📚 Focus on Organization:</strong> MyPebbles is an asset manager, not a price tracker.
                  Store asset information, organize by project, and never lose track of your collection!
                </p>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Auto-Fill Accuracy</h2>
              <p className="text-gray-600 mb-4">
                The browser extension tries its best to automatically extract product information, but it's
                not perfect! Please always double-check:
              </p>

              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Creator/Brand name</strong> - Sometimes sale timers or discount text gets detected</li>
                <li><strong>Price</strong> - Make sure original and sale prices are correct</li>
                <li><strong>Product title</strong> - Verify it matches the actual product</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">What Can You Do?</h2>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Wishlist:</strong> Save assets you want to buy with one click using the browser extension</li>
                <li><strong>Bought:</strong> Mark assets as purchased and keep track of what you own</li>
                <li><strong>In Use:</strong> Tag assets you're actively using in projects</li>
                <li><strong>Projects:</strong> Create project folders and assign assets to them</li>
                <li><strong>Collections:</strong> Group assets by creator, style, or any category you want</li>
                <li><strong>Tags:</strong> Add custom tags and browse by platform, creator, or your own categories</li>
                <li><strong>Save Info:</strong> Store prices, thumbnails, creator names, and URLs automatically</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Privacy & Data</h2>
              <p className="text-gray-600 mb-4">
                All your data is stored in Firebase and is only accessible to you via your Google account.
                MyPebbles doesn't share your data with anyone or use it for any purpose other than displaying
                your own asset collection to you.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-xl p-6 mt-8">
                <p className="text-center text-gray-700">
                  Made with 💙💖 by MyPebbles Team
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  For support or questions, visit our{' '}
                  <a href="https://github.com/noirioko/yuyu.kit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                    GitHub repository
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                alt="YuyuAsset"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="text-2xl font-semibold text-gray-800">YuyuAsset</span>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">About YuyuAsset Manager</h1>

            <div className="prose prose-indigo max-w-none">
              <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">What is YuyuAsset?</h2>
              <p className="text-gray-600 mb-4">
                YuyuAsset Manager is a personal asset tracking tool designed for digital artists.
                It helps you organize your wishlist, track what you've bought, and manage your asset
                collection across multiple marketplaces like ACON3D, Gumroad, ArtStation, and VGEN.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Price Tracking Limitations</h2>
              <div className="bg-blue-50 border-l-4 border-indigo-500 p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>⚠️ Important:</strong> Due to security measures implemented by marketplaces like ACON3D,
                  automatic price monitoring has limitations.
                </p>
              </div>

              <p className="text-gray-600 mb-4">
                YuyuAsset's browser extension can capture prices when you manually visit product pages,
                but server-side price checking may not work for all marketplaces due to:
              </p>

              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Anti-bot protection (403 Forbidden errors)</li>
                <li>CAPTCHA requirements</li>
                <li>Dynamic content rendering</li>
                <li>Encrypted HTML elements</li>
              </ul>

              <p className="text-gray-600 mb-4">
                <strong>Our recommendation:</strong> Use YuyuAsset primarily for organizing your wishlist and
                tracking what you've purchased. Price tracking works best when you manually visit pages with
                the browser extension installed.
              </p>

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

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Purpose & Philosophy</h2>
              <p className="text-gray-600 mb-4">
                YuyuAsset is built for <strong>organization and tracking</strong>, not aggressive price monitoring.
                Think of it as your personal digital asset library where you can:
              </p>

              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Keep track of assets you want to buy</li>
                <li>Remember what you've already purchased</li>
                <li>Organize by project or collection</li>
                <li>Tag and categorize your assets</li>
                <li>Know which creator made what</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Privacy & Data</h2>
              <p className="text-gray-600 mb-4">
                All your data is stored in Firebase and is only accessible to you via your Google account.
                YuyuAsset doesn't share your data with anyone or use it for any purpose other than displaying
                your own asset collection to you.
              </p>

              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-6 mt-8">
                <p className="text-center text-gray-700">
                  Made with 💜 by YuyuAsset Team
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  For support or questions, visit our{' '}
                  <a href="https://github.com/noirioko/yuyu.kit" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
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

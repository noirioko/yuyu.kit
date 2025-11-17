'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  const router = useRouter();
  const [theme] = useState<'night' | 'day'>('night');

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 relative ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#0a1c3d] via-[#1a2332] to-[#0a1c3d] border-white/10'
          : 'bg-gradient-to-r from-[#91d2f4]/30 via-[#cba2ea]/20 to-[#91d2f4]/30 border-gray-200'
      }`}>
        <div className="container mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img
                src="/yuyu_mojis/yuwon_veryhappy.png"
                alt="MyPebbles"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className={`text-2xl font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>MyPebbles</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors ${
            theme === 'night'
              ? 'bg-white/5 backdrop-blur-lg border border-white/10'
              : 'bg-white'
          }`}>
            <div className="p-8">
              <h1 className={`text-3xl font-bold mb-6 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Privacy Policy</h1>

              <p className={`text-sm mb-8 ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>
                Last updated: January 2025
              </p>

              <div className="prose prose-blue max-w-none">
                <h2 className={`text-xl font-semibold mt-6 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>What MyPebbles Is</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles is a personal asset manager for creative digital assets from marketplaces like ACON3D, Clip Studio Paint, Gumroad, and others. It helps you organize what you want to buy, what you've bought, and what you're using in your projects.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>What Data We Collect</h2>

                <h3 className={`text-lg font-semibold mt-6 mb-2 ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>From the Website:</h3>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Google Account Information:</strong> Your name, email, and profile picture when you sign in with Google</li>
                  <li><strong>Asset Data:</strong> Information you save about digital assets (title, price, URL, images, descriptions, tags)</li>
                  <li><strong>Organization Data:</strong> Projects and collections you create to organize your assets</li>
                </ul>

                <h3 className={`text-lg font-semibold mt-6 mb-2 ${
                  theme === 'night' ? 'text-white/90' : 'text-gray-700'
                }`}>From the Browser Extension:</h3>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>Your Settings:</strong> Your Firebase User ID, default status preferences, selected project, and Quick Add toggle setting</li>
                  <li><strong>Page Data:</strong> Asset information extracted from marketplace product pages you choose to save</li>
                  <li><strong>Current Page URL:</strong> To detect which marketplace you're on and whether to show the Quick Add button</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>How We Use Your Data</h2>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li>To display your saved assets back to you</li>
                  <li>To organize your assets by project, collection, and tags</li>
                  <li>To remember your preferences (theme, default status, etc.)</li>
                  <li>To sync your extension settings across your devices</li>
                </ul>

                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <strong>That's it.</strong> We don't analyze your data, sell it, share it with third parties, or use it for advertising.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Where Your Data Is Stored</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  All your data is stored in Google Firebase and is only accessible to you through your Google account. MyPebbles uses Firebase Authentication and Firestore to manage your account and store your assets securely.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Data Sharing</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We don't share your data with anyone. Period.
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li>We don't sell your data</li>
                  <li>We don't share your data with advertisers</li>
                  <li>We don't use your data for marketing</li>
                  <li>We don't track you across other websites</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Your Rights</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  You own your data. You can:
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>View your data:</strong> Everything you save is visible in your dashboard</li>
                  <li><strong>Edit your data:</strong> Update or delete any asset, project, or collection anytime</li>
                  <li><strong>Delete everything:</strong> Use the "Delete All Data" option in your profile menu to permanently remove all your data</li>
                  <li><strong>Sign out anytime:</strong> Your data stays in Firebase but you can disconnect access by signing out</li>
                </ul>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Browser Extension Permissions</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  The extension requests these permissions:
                </p>
                <ul className={`list-disc pl-6 mb-4 space-y-2 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <li><strong>storage:</strong> To save your settings locally in your browser</li>
                  <li><strong>activeTab & tabs:</strong> To detect which marketplace page you're on and extract asset information</li>
                  <li><strong>notifications:</strong> To show success/error notifications when you save assets</li>
                  <li><strong>https://*/*:</strong> To access marketplace websites and extract product data</li>
                </ul>

                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  The extension only activates on recognized marketplace domains. It doesn't collect browsing history, passwords, or personal information beyond what you explicitly save.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Cookies and Tracking</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles uses Firebase Authentication, which sets necessary cookies to keep you signed in. We don't use tracking cookies, analytics, or third-party advertising cookies.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Children's Privacy</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  MyPebbles is not intended for children under 13. We don't knowingly collect data from children.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Changes to This Policy</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  If we make changes to this privacy policy, we'll update the "Last updated" date at the top. Major changes will be announced on the website.
                </p>

                <h2 className={`text-xl font-semibold mt-8 mb-3 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Contact</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Questions about this privacy policy? You can reach out via GitHub or the contact information on the About page.
                </p>

                <div className={`rounded-xl p-6 mt-8 ${
                  theme === 'night'
                    ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20'
                    : 'bg-gradient-to-r from-blue-50 to-pink-50'
                }`}>
                  <p className={`text-center text-sm ${
                    theme === 'night' ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    <strong>TL;DR:</strong> Your data is yours. We store it securely in Firebase, only you can see it, and we don't share it with anyone. You can delete everything anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

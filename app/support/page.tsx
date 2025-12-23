'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState<{top: number, right: number} | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a1c3d]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#101c29] via-[#0a1c3d] via-[#131f5a] via-[#3f3381] to-[#2868c6] border-[#2868c6]/30'
          : 'bg-gradient-to-r from-[#91d2f4]/90 via-[#cba2ea]/80 to-[#91d2f4]/90 border-gray-200'
      }`}>
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-6">
              {/* Back button on mobile */}
              <button
                onClick={() => router.push('/')}
                className={`sm:hidden p-2 -ml-2 rounded-lg transition ${
                  theme === 'night' ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/')}
                className="hidden sm:flex items-center gap-2 md:gap-3 hover:opacity-80 transition cursor-pointer"
              >
                <img
                  src="/yuyu_mojis/yuwon_veryhappy.png"
                  alt="MyPebbles"
                  className="h-8 md:h-10 w-auto rounded-lg object-contain"
                />
                <span className={`text-xl md:text-2xl font-semibold ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>MyPebbles</span>
              </button>
              <span className={`sm:hidden text-lg font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Support</span>
              <span className={`hidden sm:inline ${theme === 'night' ? 'text-white/40' : 'text-gray-400'}`}>/</span>
              <span className={`hidden sm:inline text-lg md:text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>Support</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => {
                    if (profileButtonRef.current) {
                      const rect = profileButtonRef.current.getBoundingClientRect();
                      setProfileMenuPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right
                      });
                    }
                    setShowProfileMenu(!showProfileMenu);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
                >
                  <img
                    src={user?.photoURL || ''}
                    alt={user?.displayName || ''}
                    className="w-10 h-10 rounded-full"
                  />
                  <svg className={`w-4 h-4 ${theme === 'night' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileMenu && profileMenuPosition && typeof window !== 'undefined' && createPortal(
                  <div
                    ref={profileMenuRef}
                    className={`fixed w-56 rounded-xl shadow-lg border py-2 ${
                      theme === 'night'
                        ? 'bg-[#0a1c3d] border-white/20'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{
                      top: `${profileMenuPosition.top}px`,
                      right: `${profileMenuPosition.right}px`,
                      zIndex: 99999
                    }}
                  >
                    <div className={`px-4 py-2 border-b ${theme === 'night' ? 'border-white/10' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>{user?.displayName}</p>
                      <p className={`text-xs ${theme === 'night' ? 'text-white/60' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        router.push('/');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={toggleTheme}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-[#91d2f4]/20'
                      }`}
                    >
                      {theme === 'night' ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span>{theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}</span>
                    </button>

                    <div className={`border-t my-2 ${theme === 'night' ? 'border-white/10' : 'border-gray-100'}`}></div>

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 cursor-pointer ${
                        theme === 'night'
                          ? 'text-white hover:bg-white/10'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors ${
            theme === 'night'
              ? 'bg-white/5 backdrop-blur-lg border border-white/10'
              : 'bg-white'
          }`}>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'night' ? 'bg-[#2868c6]/20' : 'bg-[#91d2f4]/20'
                }`}>
                  <svg className={`w-6 h-6 ${theme === 'night' ? 'text-[#91d2f4]' : 'text-[#2868c6]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h1 className={`text-3xl font-bold ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Support & Help</h1>
              </div>

              {/* Contact Section */}
              <div className={`rounded-xl p-6 mb-6 ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#2868c6]/20 to-[#cba2ea]/20 border border-white/10'
                  : 'bg-gradient-to-r from-blue-50 to-pink-50 border border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-4 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Contact Us</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Have a question, found a bug, or want to suggest a feature? We&apos;d love to hear from you!
                </p>
                <a
                  href="mailto:support@pebblz.xyz"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 ${
                    theme === 'night'
                      ? 'bg-[#2868c6] text-white hover:bg-[#2868c6]/80'
                      : 'bg-[#2868c6] text-white hover:bg-[#2868c6]/90'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@pebblz.xyz
                </a>
              </div>

              {/* Report a Bug */}
              <h2 className={`text-xl font-semibold mb-4 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Report a Bug</h2>
              <p className={`mb-4 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                When reporting a bug, please include:
              </p>
              <ul className={`list-disc list-inside mb-6 space-y-2 ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                <li>What you were trying to do</li>
                <li>What happened instead</li>
                <li>Which browser you&apos;re using (Chrome, Firefox, etc.)</li>
                <li>Screenshots if possible</li>
                <li>The URL of the page where the issue occurred (if using the extension)</li>
              </ul>

              {/* FAQ */}
              <h2 className={`text-xl font-semibold mb-4 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Frequently Asked Questions</h2>

              <div className="space-y-4 mb-6">
                <div className={`rounded-xl p-4 ${
                  theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>The extension isn&apos;t detecting the price correctly</h3>
                  <p className={`text-sm ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Price detection works best on supported platforms (ACON3D, Clip Studio, Amazon). For other sites, the price might not be detected correctly - just save it first, then edit the details in the app. The extension tries its best but every website is different!
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${
                  theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>How do I connect the extension to my account?</h3>
                  <p className={`text-sm ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Go to the Dashboard, click &quot;Copy User ID&quot; in the header, then open the extension popup and paste your User ID in the settings. Check the About page for step-by-step instructions with screenshots!
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${
                  theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Can I use MyPebbles on websites not listed as supported?</h3>
                  <p className={`text-sm ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Yes! The extension works on any website. It uses generic extraction to try to get the title, image, and price. Some sites work better than others - just save it and edit the details afterward in the app if needed.
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${
                  theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>Is my data safe?</h3>
                  <p className={`text-sm ${
                    theme === 'night' ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Yes! Your data is stored securely in Firebase and is only accessible to you via your Google account. We don&apos;t share your data with anyone. You can delete all your data anytime from the profile menu.
                  </p>
                </div>
              </div>

              {/* Links */}
              <div className={`border-t pt-6 ${
                theme === 'night' ? 'border-white/10' : 'border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Helpful Links</h2>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/about"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      theme === 'night'
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About & How to Use
                  </a>
                  <a
                    href="/privacy"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      theme === 'night'
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Privacy Policy
                  </a>
                  <a
                    href="https://chromewebstore.google.com/detail/mypebbles-asset-manager/chedpgdgjdnjdfkkpebikmcdnlfafpda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      theme === 'night'
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z"/>
                    </svg>
                    Get Extension
                  </a>
                </div>
              </div>

              {/* Support Ko-fi */}
              <div className={`rounded-xl p-6 mt-6 text-center ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#FF5E5B]/20 to-[#cba2ea]/20 border border-white/10'
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border border-gray-200'
              }`}>
                <p className={`mb-3 ${
                  theme === 'night' ? 'text-white/80' : 'text-gray-700'
                }`}>
                  Enjoying MyPebbles? Consider supporting development!
                </p>
                <a
                  href="https://ko-fi.com/yuyukit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5E5B] hover:bg-[#ff4744] text-white rounded-xl font-semibold transition-all hover:scale-105"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z"/>
                  </svg>
                  Support on Ko-fi
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

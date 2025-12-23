'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
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

  // Generate stars for galaxy background
  const stars = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      width: Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.3,
      animationDuration: Math.random() * 3 + 2,
      animationDelay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 relative ${
        theme === 'night'
          ? 'bg-gradient-to-r from-[#0a1c3d] via-[#1a2332] to-[#0a1c3d] border-white/10'
          : 'bg-gradient-to-r from-[#91d2f4]/90 via-[#cba2ea]/80 to-[#91d2f4]/90 border-gray-200'
      }`}>
        {/* Animated Stars (Night Mode Only) */}
        {theme === 'night' && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute bg-white rounded-full animate-twinkle"
                style={{
                  width: `${star.width}px`,
                  height: `${star.height}px`,
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  opacity: star.opacity,
                  animationDuration: `${star.animationDuration}s`,
                  animationDelay: `${star.animationDelay}s`,
                }}
              />
            ))}
          </div>
        )}

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
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); router.push('/'); }}
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
              </a>
              <span className={`sm:hidden text-lg font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Pricing</span>
              <span className={`hidden sm:inline ${theme === 'night' ? 'text-white/40' : 'text-gray-400'}`}>/</span>
              <span className={`hidden sm:inline text-lg md:text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>Pricing</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Show profile dropdown if logged in, otherwise show sign in button */}
              {user ? (
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
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    theme === 'night'
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-[#2868c6] text-white hover:bg-[#2868c6]/90'
                  }`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${
            theme === 'night' ? 'text-white' : 'text-gray-800'
          }`}>
            Choose Your Path
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            theme === 'night' ? 'text-white/70' : 'text-gray-600'
          }`}>
            Start organizing your digital asset collection today. Pick the plan that works for you!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className={`rounded-2xl p-8 transition-all hover:scale-[1.02] ${
            theme === 'night'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white border border-gray-200 shadow-lg'
          }`}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🌱</div>
              <h2 className={`text-2xl font-bold mb-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Free Sprout</h2>
              <p className={`text-sm ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>Perfect for getting started</p>
            </div>

            <div className="text-center mb-6">
              <span className={`text-4xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Free</span>
              <span className={`text-sm ml-2 ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>forever</span>
            </div>

            <ul className={`space-y-3 mb-8 ${
              theme === 'night' ? 'text-white/80' : 'text-gray-600'
            }`}>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                Up to 50 assets
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                3 projects
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                5 collections
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                Browser extension
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                ACON sale checker
              </li>
            </ul>

            <button
              onClick={() => router.push('/')}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                theme === 'night'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Get Started Free
            </button>
          </div>

          {/* Zen Gardener - Yearly */}
          <div className={`rounded-2xl p-8 transition-all hover:scale-[1.02] relative overflow-hidden ${
            theme === 'night'
              ? 'bg-gradient-to-br from-[#2868c6]/30 to-[#cba2ea]/30 border border-[#91d2f4]/30'
              : 'bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 border border-[#cba2ea]/30 shadow-lg'
          }`}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🌿</div>
              <h2 className={`text-2xl font-bold mb-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Zen Gardener</h2>
              <p className={`text-sm ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>For the growing collector</p>
            </div>

            <div className="text-center mb-6">
              <span className={`text-4xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>IDR 199,000</span>
              <span className={`text-sm ml-2 ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>/year</span>
            </div>

            <ul className={`space-y-3 mb-8 ${
              theme === 'night' ? 'text-white/80' : 'text-gray-600'
            }`}>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <strong>Unlimited</strong> assets
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <strong>Unlimited</strong> projects
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <strong>Unlimited</strong> collections
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                Browser extension
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                ACON sale checker (all pages)
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                Priority support
              </li>
            </ul>

            <a
              href="https://pebblz.lemonsqueezy.com/checkout/buy/256f4e17-8a27-4b41-aaa6-b6e5d2bac09b"
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full py-3 rounded-xl font-semibold text-center transition ${
                theme === 'night'
                  ? 'bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white hover:opacity-90'
              }`}
            >
              Subscribe Now
            </a>
          </div>
        </div>

        {/* Lifetime Deal Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className={`rounded-2xl p-8 relative overflow-hidden ${
            theme === 'night'
              ? 'bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 border border-[#fbbf24]/30'
              : 'bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border border-[#fbbf24]/50 shadow-lg'
          }`}>
            {/* Best Value Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                theme === 'night'
                  ? 'bg-[#fbbf24] text-[#78350f]'
                  : 'bg-[#fbbf24] text-[#78350f]'
              }`}>
                BEST VALUE
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 text-center md:text-left">
                <div className="text-6xl mb-2">🏰</div>
              </div>

              <div className="flex-grow text-center md:text-left">
                <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>Zen Castle</h2>
                <p className={`mb-4 ${
                  theme === 'night' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  One-time payment, lifetime access. Build your castle forever!
                </p>
                <ul className={`flex flex-wrap gap-4 justify-center md:justify-start text-sm ${
                  theme === 'night' ? 'text-white/80' : 'text-gray-600'
                }`}>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Everything in Zen Gardener
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Lifetime updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Pay once, use forever
                  </li>
                </ul>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className={`text-3xl md:text-4xl font-bold mb-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-800'
                }`}>
                  IDR 399,000
                </div>
                <p className={`text-sm mb-4 ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  one-time payment
                </p>
                <a
                  href="https://pebblz.lemonsqueezy.com/checkout/buy/13b607a5-7cc9-482d-824c-f0450c59903e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 rounded-xl font-semibold transition bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-white hover:opacity-90"
                >
                  Get Lifetime Access
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className={`text-2xl font-bold text-center mb-8 ${
            theme === 'night' ? 'text-white' : 'text-gray-800'
          }`}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className={`rounded-xl p-6 ${
              theme === 'night'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>What happens to my data if I cancel?</h3>
              <p className={`text-sm ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                Your data stays safe! If you downgrade, you'll keep all your assets but won't be able to add more beyond the free limit.
              </p>
            </div>

            <div className={`rounded-xl p-6 ${
              theme === 'night'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Can I upgrade from yearly to lifetime?</h3>
              <p className={`text-sm ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                Yes! Contact us and we'll help you upgrade. Your remaining subscription time will be credited.
              </p>
            </div>

            <div className={`rounded-xl p-6 ${
              theme === 'night'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Is there a refund policy?</h3>
              <p className={`text-sm ${
                theme === 'night' ? 'text-white/70' : 'text-gray-600'
              }`}>
                Yes, we offer a 7-day money-back guarantee. If you're not happy, we'll refund you - no questions asked!
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className={`mb-4 ${
            theme === 'night' ? 'text-white/60' : 'text-gray-500'
          }`}>
            Questions? We're here to help!
          </p>
          <a
            href="mailto:support@pebblz.xyz"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
              theme === 'night'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

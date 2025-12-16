'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [stats, setStats] = useState({ assets: 0, projects: 0, collections: 0 });
  const FREE_LIMITS = { maxAssets: 50, maxProjects: 3 };

  // Fetch subscription status
  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription?userId=${user.uid}`);
        const data = await response.json();
        setIsPremium(data.isPremium || false);
        setSubscriptionType(data.subscriptionType || null);
        setSubscriptionStatus(data.subscriptionStatus || null);
        setEndsAt(data.endsAt || null);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setIsPremium(false);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Fetch stats
  useEffect(() => {
    if (!user || !db) return;

    const fetchStats = async () => {
      if (!db) return;
      try {
        const [assetsSnap, projectsSnap, collectionsSnap] = await Promise.all([
          getDocs(query(collection(db, 'assets'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'projects'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'collections'), where('userId', '==', user.uid))),
        ]);
        setStats({
          assets: assetsSnap.size,
          projects: projectsSnap.size,
          collections: collectionsSnap.size,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'night' ? 'bg-[#0a1c3d]' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'night' ? 'text-white' : 'text-gray-800'}`}>Please sign in</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-lg hover:shadow-lg transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
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
              {/* Logo on desktop */}
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
              {/* Title on mobile */}
              <span className={`sm:hidden text-lg font-semibold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>Profile</span>
              {/* Breadcrumb on desktop */}
              <span className={`hidden sm:inline ${theme === 'night' ? 'text-white/40' : 'text-gray-400'}`}>/</span>
              <span className={`hidden sm:inline text-lg md:text-xl font-medium ${
                theme === 'night' ? 'text-white/80' : 'text-gray-600'
              }`}>Profile</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        {/* Profile Card */}
        <div className={`rounded-2xl shadow-sm p-6 md:p-8 mb-6 ${
          theme === 'night'
            ? 'bg-white/5 backdrop-blur-lg border border-white/10'
            : 'bg-white'
        }`}>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <img
                src={user.photoURL || ''}
                alt={user.displayName || ''}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              {isPremium && !subscriptionLoading && (
                <span className="absolute -top-1 -right-1 text-2xl drop-shadow-md">👑</span>
              )}
            </div>
            <h1 className={`text-2xl font-bold mb-1 ${
              theme === 'night' ? 'text-white' : 'text-gray-800'
            }`}>{user.displayName}</h1>
            <p className={`text-sm ${
              theme === 'night' ? 'text-white/60' : 'text-gray-500'
            }`}>{user.email}</p>
          </div>

          {/* Subscription Status */}
          <div className={`rounded-xl p-4 mb-6 ${
            isPremium
              ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30'
              : theme === 'night'
                ? 'bg-white/5 border border-white/10'
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{isPremium ? '👑' : '✨'}</span>
                  <h3 className={`font-semibold ${
                    theme === 'night' ? 'text-white' : 'text-gray-800'
                  }`}>{isPremium ? 'Premium' : 'Free Plan'}</h3>
                </div>
                <p className={`text-sm ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  {isPremium
                    ? 'Unlimited assets & projects'
                    : `${stats.assets}/${FREE_LIMITS.maxAssets} assets, ${stats.projects}/${FREE_LIMITS.maxProjects} projects`}
                </p>
              </div>
              {!isPremium && !subscriptionLoading && (
                <button
                  onClick={() => router.push('/upgrade')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#2868c6] to-[#cba2ea] rounded-lg hover:opacity-90 transition cursor-pointer"
                >
                  Upgrade
                </button>
              )}
              {isPremium && !subscriptionLoading && subscriptionType === 'lifetime' && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  theme === 'night'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  Lifetime
                </span>
              )}
              {isPremium && !subscriptionLoading && subscriptionType === 'subscription' && (
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    subscriptionStatus === 'cancelled'
                      ? theme === 'night' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                      : theme === 'night' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    {subscriptionStatus === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                  {subscriptionStatus === 'cancelled' && endsAt && (
                    <span className={`text-xs ${theme === 'night' ? 'text-white/50' : 'text-gray-500'}`}>
                      Access until {new Date(endsAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cancel Subscription for active subscribers */}
          {isPremium && subscriptionType === 'subscription' && subscriptionStatus !== 'cancelled' && (
            <div className={`rounded-xl p-4 mb-6 ${
              theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-sm mb-3 ${theme === 'night' ? 'text-white/70' : 'text-gray-600'}`}>
                Need to cancel? You can manage your subscription through our payment provider.
              </p>
              <a
                href={`mailto:support@pebblz.xyz?subject=Cancel Subscription&body=User ID: ${user.uid}%0A%0APlease cancel my subscription.`}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                  theme === 'night'
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Request Cancellation
              </a>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`text-center p-4 rounded-xl ${
              theme === 'night' ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>{stats.assets}</p>
              <p className={`text-xs ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>Assets</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${
              theme === 'night' ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>{stats.projects}</p>
              <p className={`text-xs ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>Projects</p>
            </div>
            <div className={`text-center p-4 rounded-xl ${
              theme === 'night' ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold ${
                theme === 'night' ? 'text-white' : 'text-gray-800'
              }`}>{stats.collections}</p>
              <p className={`text-xs ${
                theme === 'night' ? 'text-white/60' : 'text-gray-500'
              }`}>Collections</p>
            </div>
          </div>

          {/* User ID */}
          <div className={`rounded-xl p-4 mb-6 ${
            theme === 'night' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs mb-1 ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>User ID (for browser extension)</p>
                <p className={`text-sm font-mono ${
                  theme === 'night' ? 'text-white/80' : 'text-gray-700'
                }`}>{user.uid.slice(0, 20)}...</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.uid);
                  alert('User ID copied!');
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                  theme === 'night'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition cursor-pointer ${
                theme === 'night'
                  ? 'bg-white/5 hover:bg-white/10 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {theme === 'night' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                <span>{theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}</span>
              </div>
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/about')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition cursor-pointer ${
                theme === 'night'
                  ? 'bg-white/5 hover:bg-white/10 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About MyPebbles</span>
              </div>
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  signOut();
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition cursor-pointer ${
                theme === 'night'
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

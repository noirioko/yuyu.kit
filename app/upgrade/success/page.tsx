'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UpgradeSuccessPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Auto redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      <div className="text-center px-4">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#2868c6] to-[#cba2ea] flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className={`text-3xl font-bold mb-4 ${
          theme === 'night' ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome to Premium!
        </h1>

        <p className={`text-lg mb-8 ${
          theme === 'night' ? 'text-white/70' : 'text-gray-600'
        }`}>
          Thank you for supporting MyPebbles! You now have unlimited assets and projects.
        </p>

        <div className={`p-6 rounded-xl mb-8 ${
          theme === 'night'
            ? 'bg-white/5 border border-white/10'
            : 'bg-white shadow-sm'
        }`}>
          <p className={`text-sm ${
            theme === 'night' ? 'text-white/60' : 'text-gray-500'
          }`}>
            Your premium status has been activated. If you don't see the changes immediately, try refreshing the page.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
        >
          Go to Dashboard
        </button>

        <p className={`mt-4 text-sm ${
          theme === 'night' ? 'text-white/40' : 'text-gray-400'
        }`}>
          Redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

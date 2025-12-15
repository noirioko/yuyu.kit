'use client';

import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UpgradePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Failed to create checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'night' ? 'bg-[#0a0f1e]' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className={`mb-8 flex items-center gap-2 transition cursor-pointer ${
              theme === 'night' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          {/* Upgrade Card */}
          <div className={`rounded-2xl shadow-lg overflow-hidden ${
            theme === 'night'
              ? 'bg-gradient-to-br from-[#2868c6]/20 to-[#cba2ea]/20 border border-white/10'
              : 'bg-white'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2868c6] to-[#cba2ea] p-8 text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Upgrade to Premium</h1>
              <p className="opacity-90">Unlimited assets & projects forever!</p>
            </div>

            {/* Pricing */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className={`text-5xl font-bold mb-2 ${
                  theme === 'night' ? 'text-white' : 'text-gray-900'
                }`}>
                  $10
                </div>
                <div className={`text-lg ${
                  theme === 'night' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  One-time payment • Lifetime access
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={theme === 'night' ? 'text-white' : 'text-gray-700'}>
                    <strong>Unlimited</strong> assets (vs 50 free)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={theme === 'night' ? 'text-white' : 'text-gray-700'}>
                    <strong>Unlimited</strong> projects (vs 3 free)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={theme === 'night' ? 'text-white' : 'text-gray-700'}>
                    Lifetime access - pay once, use forever
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={theme === 'night' ? 'text-white' : 'text-gray-700'}>
                    Support indie development
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white font-semibold rounded-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirecting to checkout...' : 'Get Premium Now'}
              </button>

              <p className={`text-center text-sm mt-4 ${
                theme === 'night' ? 'text-white/50' : 'text-gray-400'
              }`}>
                Secure payment via LemonSqueezy
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className={`mt-8 rounded-xl overflow-hidden border ${
            theme === 'night' ? 'border-white/10' : 'border-gray-200'
          }`}>
            <table className="w-full">
              <thead>
                <tr className={theme === 'night' ? 'bg-white/5' : 'bg-gray-50'}>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    theme === 'night' ? 'text-white' : 'text-gray-700'
                  }`}>Feature</th>
                  <th className={`px-6 py-3 text-center text-sm font-semibold ${
                    theme === 'night' ? 'text-white/70' : 'text-gray-500'
                  }`}>Free</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[#2868c6]">Premium</th>
                </tr>
              </thead>
              <tbody className={theme === 'night' ? 'text-white/80' : 'text-gray-600'}>
                <tr className={theme === 'night' ? 'border-t border-white/10' : 'border-t border-gray-200'}>
                  <td className="px-6 py-3">Assets</td>
                  <td className="px-6 py-3 text-center">50</td>
                  <td className="px-6 py-3 text-center font-semibold text-[#2868c6]">Unlimited</td>
                </tr>
                <tr className={theme === 'night' ? 'border-t border-white/10' : 'border-t border-gray-200'}>
                  <td className="px-6 py-3">Projects</td>
                  <td className="px-6 py-3 text-center">3</td>
                  <td className="px-6 py-3 text-center font-semibold text-[#2868c6]">Unlimited</td>
                </tr>
                <tr className={theme === 'night' ? 'border-t border-white/10' : 'border-t border-gray-200'}>
                  <td className="px-6 py-3">Collections</td>
                  <td className="px-6 py-3 text-center">Unlimited</td>
                  <td className="px-6 py-3 text-center font-semibold text-[#2868c6]">Unlimited</td>
                </tr>
                <tr className={theme === 'night' ? 'border-t border-white/10' : 'border-t border-gray-200'}>
                  <td className="px-6 py-3">Browser Extension</td>
                  <td className="px-6 py-3 text-center">Yes</td>
                  <td className="px-6 py-3 text-center font-semibold text-[#2868c6]">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

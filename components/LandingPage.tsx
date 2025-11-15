'use client';

import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';

export default function LandingPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Gradient circles in background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-pink-200 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-200 to-blue-200 rounded-full blur-3xl opacity-30 translate-y-32 -translate-x-32"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-blue-100 to-pink-100 rounded-full blur-2xl opacity-20"></div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/yuyu_mojis/yuwon_veryhappy.png"
                alt="MyPebbles"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">MyPebbles</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 md:py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-pink-100 rounded-full">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                ACON3D & CSP Asset Manager
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Your Digital Asset Library
              <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent"> Made Easy</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Organize and manage your ACON3D and CSP assets in one place.
              Track wishlists, organize by project, and never lose track of what you've bought!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free forever
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">Free</div>
                <div className="text-sm text-gray-500">No credit card</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">Unlimited</div>
                <div className="text-sm text-gray-500">Assets tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">Organized</div>
                <div className="text-sm text-gray-500">By projects</div>
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative">
            <div className="relative w-full h-[500px]">
              <Image
                src="/images/stone-stack.png"
                alt="Organized pebbles stack"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Wishlist Tracking</h3>
            <p className="text-gray-600 leading-relaxed">Keep track of assets you want to buy. Never forget what caught your eye!</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Project Organization</h3>
            <p className="text-gray-600 leading-relaxed">Group assets by project. Keep everything organized and easy to find.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Tag Everything</h3>
            <p className="text-gray-600 leading-relaxed">Tag assets by platform, creator, or custom categories for quick filtering.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

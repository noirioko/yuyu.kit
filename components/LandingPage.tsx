'use client';

import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';
import { useState } from 'react';

export default function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Gradient circles in background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#91d2f4]/40 to-[#cba2ea]/40 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#cba2ea]/40 to-[#91d2f4]/40 rounded-full blur-3xl opacity-30 translate-y-32 -translate-x-32"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-[#91d2f4]/20 to-[#cba2ea]/20 rounded-full blur-2xl opacity-20"></div>

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
            <span className="text-2xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">MyPebbles</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-8 md:py-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto relative">
          {/* Garden Background for Hero Section */}
          <div
            className="absolute inset-0 -mx-12 -my-8 bg-cover bg-center bg-no-repeat rounded-3xl -z-10"
            style={{
              backgroundImage: 'url(/images/landingpage-garden.jpg)',
              opacity: 0.5
            }}
          />
          <div className="absolute inset-0 -mx-12 -my-8 bg-white/30 rounded-3xl -z-10" />
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#91d2f4]/20 to-[#cba2ea]/20 rounded-full">
              <span className="text-sm font-semibold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">
                ACON3D & CSP Asset Manager
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Your Digital Asset Library
              <span className="bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent"> Made Easy</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Organize and manage your ACON3D and CSP assets in one place.
              Track wishlists, organize by project, and never lose track of what you've bought!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={signInWithGoogle}
                className="glitter-hover inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
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
            <div className="flex gap-16 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">Free</div>
                <div className="text-sm text-gray-500">No credit card</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">Unlimited</div>
                <div className="text-sm text-gray-500">Assets tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">Organized</div>
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
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all text-center">
            <div className="w-32 h-32 flex items-center justify-center mb-6 mx-auto">
              <Image
                src="/images/rockandfrog.png"
                alt="Wishlist"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Wishlist Tracking</h3>
            <p className="text-gray-600 leading-relaxed">Keep track of assets you want to buy. Never forget what caught your eye!</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all text-center">
            <div className="w-32 h-32 flex items-center justify-center mb-6 mx-auto">
              <Image
                src="/images/frogparent.png"
                alt="Projects"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Project Organization</h3>
            <p className="text-gray-600 leading-relaxed">Group assets by project. Keep everything organized and easy to find.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all text-center">
            <div className="w-32 h-32 flex items-center justify-center mb-6 mx-auto">
              <Image
                src="/images/frogtags.png"
                alt="Tags"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Tag Everything</h3>
            <p className="text-gray-600 leading-relaxed">Tag assets by platform, creator, or custom categories for quick filtering.</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-32 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-3xl p-12 border border-gray-200">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">
              How it works
            </h2>

            {/* Steps */}
            <div className="space-y-6 mb-12">
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#2868c6]">1. Download the extension:</span> Install our Chrome extension from the Chrome Web Store.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#2868c6]">2. Browse your favorite sites:</span> Visit ACON3D or Clip Studio Paint Assets.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#2868c6]">3. Save with one click:</span> Click the extension icon and instantly save assets to your library!
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#2868c6]">4. Organize your collection:</span> Create projects, add tags, and manage everything in one beautiful dashboard. Track what you've bought, what's on your wishlist, and what you're currently using!
              </p>
            </div>

            {/* Screenshots */}
            <div className="grid md:grid-cols-3 gap-6">
              <button
                onClick={() => setLightboxImage('/images/ss-extension.png')}
                className="relative w-full h-[280px] bg-white/30 rounded-xl p-4 hover:bg-white/50 transition-all cursor-pointer group overflow-hidden"
              >
                <Image
                  src="/images/ss-extension.png"
                  alt="Extension screenshot"
                  fill
                  className="object-contain rounded-lg p-4 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all rounded-xl">
                  <span className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Click to enlarge
                  </span>
                </div>
              </button>
              <button
                onClick={() => setLightboxImage('/images/ss-app.png')}
                className="relative w-full h-[280px] bg-white/30 rounded-xl p-4 hover:bg-white/50 transition-all cursor-pointer group overflow-hidden"
              >
                <Image
                  src="/images/ss-app.png"
                  alt="App dashboard screenshot"
                  fill
                  className="object-contain rounded-lg p-4 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all rounded-xl">
                  <span className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Click to enlarge
                  </span>
                </div>
              </button>
              <button
                onClick={() => setLightboxImage('/images/ss-project.png')}
                className="relative w-full h-[280px] bg-white/30 rounded-xl p-4 hover:bg-white/50 transition-all cursor-pointer group overflow-hidden"
              >
                <Image
                  src="/images/ss-project.png"
                  alt="Project organization screenshot"
                  fill
                  className="object-contain rounded-lg p-4 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all rounded-xl">
                  <span className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Click to enlarge
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Call to Action - Castle */}
        <div className="mt-32 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-3xl p-12 border border-gray-200">
            {/* Philosophy */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
                Assets are like pebbles — collect enough and you can build something amazing. But scattered pebbles? Just a mess.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-3 max-w-2xl mx-auto">
                MyPebbles gives your collection structure, so you can stop hoarding and start creating.
              </p>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent mb-8 text-center">
              Go build that castle!
            </h2>
            <div className="relative w-48 h-48 mx-auto">
              <Image
                src="/images/castle.png"
                alt="Build your castle"
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pb-8">
          <p className="text-center text-gray-700">
            Made by YuyuKit
          </p>
          <p className="text-center text-sm mt-2 text-gray-500">
            © melty haeon 2025
          </p>
          <p className="text-center text-sm mt-3">
            <a href="/privacy" className="text-gray-600 hover:text-[#2868c6] transition underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full max-w-6xl h-[90vh]">
            <Image
              src={lightboxImage}
              alt="Screenshot enlarged"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="absolute bottom-4 text-white/60 text-sm">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}

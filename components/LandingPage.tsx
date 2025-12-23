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

      {/* Cat-bling peeking menacingly from top right corner */}
      <div className="absolute -top-16 right-8 w-[320px] h-[320px] z-0 opacity-70 pointer-events-none">
        <Image
          src="/images/cat-bling.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>

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
          {/* White background to hide cat-bling behind */}
          <div className="absolute inset-0 -mx-12 -my-8 bg-white rounded-3xl z-[1]" />
          {/* Garden Background for Hero Section - washed out */}
          <div
            className="absolute inset-0 -mx-12 -my-8 bg-cover bg-center bg-no-repeat rounded-3xl z-[2] opacity-40"
            style={{
              backgroundImage: 'url(/images/landingpage-garden.jpg)',
            }}
          />

          {/* Left side - Text content */}
          <div className="space-y-6 relative z-[5]">
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

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    console.log('🔘 Sign in button clicked!');
                    signInWithGoogle();
                  }}
                  className="glitter-hover cursor-pointer inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#2868c6] to-[#cba2ea] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <a
                  href="https://chromewebstore.google.com/detail/mypebbles-asset-manager/chedpgdgjdnjdfkkpebikmcdnlfafpda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-[#2868c6] text-[#2868c6] rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all hover:bg-[#2868c6] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z"/>
                  </svg>
                  Download Extension
                </a>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free tier available • No credit card required to start
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 md:gap-16 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">50</div>
                <div className="text-sm text-gray-500">Free assets</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">$9.99</div>
                <div className="text-sm text-gray-500">Lifetime unlimited</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#2868c6] to-[#cba2ea] bg-clip-text text-transparent">Organized</div>
                <div className="text-sm text-gray-500">By projects</div>
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative z-[5]">
            <div className="relative w-full h-[500px]">
              <Image
                src="/images/stone-stack.png"
                alt="Organized pebbles stack"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
              {/* Cat-kyaa bobbing next to stone stack - like they're kissing */}
              <div className="absolute right-0 bottom-16 w-48 h-48 animate-bob" style={{ animation: 'bob 2s ease-in-out infinite' }}>
                <Image
                  src="/images/cat-kyaa.png"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
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
      </main>

      {/* Supported Platforms - Full Width (outside container) */}
      <div className="mt-16 relative w-full">
          {/* Top divider */}
          <div className="relative">
            <img src="/images/divider_blue.png" alt="" className="w-full h-auto block translate-y-[10px]" />
            {/* Heading positioned higher in the divider white area */}
            <div className="absolute left-0 right-0 px-6" style={{ top: 'calc(50% - 80px)' }}>
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl mb-0 drop-shadow-sm text-left" style={{ color: '#2E3192' }}>
                  <span style={{ fontFamily: "'Corinthia', cursive", fontWeight: 700 }} className="text-5xl md:text-6xl">Supported </span>
                  <span style={{ fontFamily: "'Boldonse', sans-serif" }} className="uppercase">Platforms</span>
                </h2>
                <p className="text-left mt-2 font-medium pb-[10px]" style={{ color: '#2E3192' }}>Works best with these marketplaces for one-time purchases!</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-12 pb-20 relative -mt-2" style={{ backgroundColor: '#2E3192' }}>
          <div className="relative z-10 max-w-6xl mx-auto" style={{ marginTop: '-30px' }}>

            {/* Best Supported */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-white/60 mb-4 text-center uppercase tracking-wider">Best Support</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    A3D
                  </div>
                  <h4 className="font-semibold text-[#2d1b69]">ACON3D</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">3D assets, textures</p>
                  <span className="inline-block mt-2 text-xs bg-[#cba2ea]/30 text-[#2d1b69] px-2 py-1 rounded-full">Title & image detection</span>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    CSP
                  </div>
                  <h4 className="font-semibold text-[#2d1b69]">Clip Studio Paint</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Brushes, materials, 3D</p>
                  <span className="inline-block mt-2 text-xs bg-[#cba2ea]/30 text-[#2d1b69] px-2 py-1 rounded-full">CLIPPY & GOLD support</span>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    AMZ
                  </div>
                  <h4 className="font-semibold text-[#2d1b69]">Amazon</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Books, art supplies, etc.</p>
                  <span className="inline-block mt-2 text-xs bg-[#cba2ea]/30 text-[#2d1b69] px-2 py-1 rounded-full">Multi-region currency</span>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-[#cba2ea]/30 hover:bg-white/90 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    VG
                  </div>
                  <h4 className="font-semibold text-[#2d1b69]">VGen</h4>
                  <p className="text-xs text-[#5a4a7e] mt-1">Artist commissions</p>
                  <span className="inline-block mt-2 text-xs bg-[#cba2ea]/30 text-[#2d1b69] px-2 py-1 rounded-full">Commission tracking</span>
                </div>
              </div>
            </div>

            {/* Also Works With */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-4 text-center uppercase tracking-wider">Also Works With</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {['Gumroad', 'itch.io', 'Booth.pm', 'Unity Asset Store', 'Sketchfab', 'ArtStation', 'Blender Market', 'Turbosquid', '+ Any website'].map((platform) => (
                  <span
                    key={platform}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      platform === '+ Any website'
                        ? 'bg-white text-[#2E3192] border border-white shadow-sm'
                        : 'bg-white/20 text-white border border-white/30'
                    }`}
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <p className="text-center text-sm text-white/70 mt-4 font-medium">
                Request a marketplace and we'll add support for it! (Not for subscription services like Freepik, Adobe Stock, Envato, etc.)
              </p>
            </div>
          </div>
          </div>
          {/* Pricing section - starts behind divider */}
          <div
            className="relative -mt-20"
            style={{ backgroundImage: 'url(/images/kawaii-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {/* Divider on top */}
            <img src="/images/divider-blue-bottom.png" alt="" className="w-full h-auto block relative z-10" />

            {/* Pricing content with heading inside */}
            <div className="px-6 pb-20 relative z-10" style={{ marginTop: '-210px' }}>
              <div className="max-w-4xl mx-auto">
                {/* Simple Pricing heading */}
                <div className="text-right mb-8" style={{ marginTop: '-30px' }}>
                  <h2 className="text-3xl md:text-4xl mb-0 drop-shadow-sm" style={{ color: '#77549d' }}>
                    <span style={{ fontFamily: "'Corinthia', cursive", fontWeight: 700 }} className="text-5xl md:text-6xl">Simple </span>
                    <span style={{ fontFamily: "'Boldonse', sans-serif" }} className="uppercase">Pricing</span>
                  </h2>
                  <p className="text-[#77549d] mt-2 font-medium">Start free, upgrade when you need more</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200 hover:shadow-lg transition-all">
              <div className="text-center mb-6">
                {/* Sleeping cat thumbnail */}
                <div className="w-56 h-56 mx-auto mb-4 relative">
                  <Image
                    src="/images/cat-rock.png"
                    alt="Sleeping cat"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900">$0</div>
                <p className="text-gray-500 mt-1">Forever free</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 50 assets
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 3 projects
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited collections
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Browser extension
                </li>
              </ul>
              <button
                onClick={() => signInWithGoogle()}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#2868c6] to-[#5a8fd6] text-white rounded-xl font-semibold hover:from-[#1e5aa8] hover:to-[#4a7fc6] transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Premium Tier */}
            <div className="shiny-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative">
              {/* Sparkle dark background */}
              <div
                className="absolute inset-0 bg-cover bg-center rounded-2xl overflow-hidden"
                style={{ backgroundImage: 'url(/images/sparkle-dark.jpg)' }}
              />

              {/* Sparkles scattered across the box */}
              <i className="fas fa-sparkles absolute top-8 left-8 text-yellow-300/70 text-lg animate-sparkle z-10"></i>
              <i className="fas fa-star absolute top-20 right-12 text-white/60 text-sm animate-sparkle z-10" style={{ animationDelay: '0.3s' }}></i>
              <i className="fas fa-sparkles absolute bottom-24 left-12 text-[#91d2f4]/70 text-base animate-sparkle z-10" style={{ animationDelay: '0.7s' }}></i>
              <i className="fas fa-star absolute bottom-32 right-8 text-yellow-200/60 text-xs animate-sparkle z-10" style={{ animationDelay: '1s' }}></i>
              <i className="fas fa-sparkles absolute top-1/2 left-6 text-white/50 text-sm animate-sparkle z-10" style={{ animationDelay: '0.5s' }}></i>
              <i className="fas fa-star absolute top-1/3 right-6 text-[#cba2ea]/60 text-base animate-sparkle z-10" style={{ animationDelay: '0.8s' }}></i>

              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full z-10">
                BETA DEAL
              </div>
              <div className="text-center mb-6 relative z-10">
                {/* Onsen cat thumbnail */}
                <div className="w-48 h-48 mx-auto mb-4 relative">
                  <Image
                    src="/images/cat-onsen.png"
                    alt="Relaxing cat"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-4xl font-bold text-white">$9.99</div>
                <p className="text-white/70 mt-1">One-time payment</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                <li className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <strong>Unlimited</strong> assets
                </li>
                <li className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <strong>Unlimited</strong> projects
                </li>
                <li className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited collections
                </li>
                <li className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lifetime access
                </li>
                <li className="flex items-center gap-2 text-white">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Support development 💜
                </li>
              </ul>
              <button
                onClick={() => signInWithGoogle()}
                className="shiny-button w-full py-3 px-6 text-white rounded-xl font-semibold hover:brightness-110 transition-all cursor-pointer relative z-10 shadow-md"
              >
                Get Premium
              </button>
            </div>
                </div>
              </div>
            </div>
            {/* Bottom rip divider */}
            <img src="/images/rip-divider.png" alt="" className="w-full h-auto block -mb-8" />
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-6xl mx-auto px-6 mt-12">
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
          <div className="relative rounded-3xl p-12 border border-gray-200 overflow-hidden">
            {/* Forest background with 60% opacity */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: 'url(/images/forest-bg.jpg)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 to-pink-50/40" />

            {/* Content */}
            <div className="relative z-10">
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
            <div className="relative w-64 h-48 mx-auto">
              <Image
                src="/images/castle.png"
                alt="Build your castle"
                fill
                className="object-contain drop-shadow-lg"
              />
              {/* Cat with pickaxe - bobbing animation on right side */}
              <div className="absolute -right-20 bottom-0 w-24 h-24 animate-bob" style={{ animation: 'bob 2s ease-in-out infinite' }}>
                <Image
                  src="/images/cat-pickaxe.png"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pb-8">
          <div className="max-w-4xl mx-auto border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left - Branding */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/yuyu_mojis/yuwon_veryhappy.png"
                    alt="MyPebbles"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="font-semibold text-gray-800">MyPebbles</span>
                  <p className="text-xs text-gray-500">Made by YuyuKit</p>
                </div>
              </div>

              {/* Center - Links */}
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="/about" className="text-gray-600 hover:text-[#2868c6] transition">
                  About
                </a>
                <a href="/pricing" className="text-gray-600 hover:text-[#2868c6] transition">
                  Pricing
                </a>
                <a href="/privacy" className="text-gray-600 hover:text-[#2868c6] transition">
                  Privacy Policy
                </a>
                <a href="mailto:support@pebblz.xyz" className="text-gray-600 hover:text-[#2868c6] transition">
                  Contact
                </a>
                <a
                  href="https://ko-fi.com/yuyukit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#2868c6] transition"
                >
                  Support Us
                </a>
              </div>

              {/* Right - Copyright */}
              <p className="text-xs text-gray-400">
                © melty haeon 2025
              </p>
            </div>
          </div>
        </div>

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

# YuyuAsset Manager

**Smart asset tracking for digital artists.** Track prices, organize by project, and never miss a sale on 3D models, brushes, and asset packs.

## Features (Phase 1)

- **Price Tracking** - Track asset prices with history
- **Price Drop Detection** - See when prices drop from their lowest point
- **Project Organization** - Organize assets into project folders
- **Creator Collections** - Group assets by creator or marketplace
- **Cloud Sync** - Access from anywhere with Firebase
- **Beautiful UI** - Clean, artist-friendly interface
- **Google Sign-In** - Secure authentication

## Quick Start

1. **Setup Firebase** (5 minutes) - See [SETUP.md](./SETUP.md) for detailed instructions
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Add your Firebase config** to `.env.local`
4. **Run the app**:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Hosting**: Vercel-ready

## Why This Could Work

**Unique value**: Price tracking for creative assets (not available in Notion/Pinterest)

**Target users**:
- Webtoon artists buying 3D backgrounds
- Game developers tracking asset store sales
- Motion designers collecting templates
- 3D artists following marketplace deals

**Monetization ideas**:
- Freemium: Free for <50 assets, paid for unlimited
- Pro features: Advanced alerts, team sharing
- Creator partnerships: Affiliate commissions

## Roadmap (Phase 2)

- Automatic price scraping
- Email alerts for price drops
- Thumbnail previews
- Search & filters
- Tags
- Export (CSV, JSON)
- Mobile app
- Team features

## Deploy on Vercel

Click the button below to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

Don't forget to add your Firebase environment variables in Vercel's project settings!

---

Built with Next.js and Firebase

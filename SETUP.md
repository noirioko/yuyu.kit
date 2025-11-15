# YuyuAsset Manager - Setup Guide

## What You Built

A smart asset manager for digital artists with:
- **Price tracking & alerts** - Track asset prices and get notified of drops
- **Project organization** - Organize assets by project folders
- **Creator collections** - Group assets by creator/store
- **Cloud sync** - Access your assets from anywhere via Firebase
- **Beautiful UI** - Clean, artist-friendly interface

## Firebase Setup (Required)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it "yuyu-asset-manager" (or whatever you like)
4. Disable Google Analytics (optional for this app)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the sidebar
2. Click "Get started"
3. Click on "Google" under "Sign-in providers"
4. Toggle "Enable"
5. Select a support email from the dropdown
6. Click "Save"

### Step 3: Create Firestore Database

1. Click "Firestore Database" in the sidebar
2. Click "Create database"
3. Select "Start in test mode" (we'll secure it later)
4. Choose a location (closest to you for better performance)
5. Click "Enable"

### Step 4: Get Your Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the Web icon `</>`
5. Register your app with nickname "yuyu-web"
6. Copy the `firebaseConfig` values
7. You'll need these values in the next step:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 5: Configure Environment Variables

1. In the `yuyu-asset-manager` folder, create a file named `.env.local`
2. Copy the contents from `.env.local.example`
3. Replace the placeholder values with your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yuyu-asset-manager.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yuyu-asset-manager
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yuyu-asset-manager.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Running the App

1. Open terminal in the `yuyu-asset-manager` folder
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser
4. Click "Sign in with Google"
5. Start adding assets!

## How to Use

### Adding Assets
1. Click "+ Add Asset" button
2. Paste the asset URL (ACON3D, Gumroad, etc.)
3. Add title, price, and details
4. Assign to a Project or Collection (optional)
5. Set status: Wishlist, Purchased, or In Use

### Creating Projects
1. Click the "+" next to "PROJECTS" in the sidebar
2. Name your project (e.g., "Webtoon Project A")
3. Choose a color
4. Add a description

### Creating Collections
1. Click the "+" next to "COLLECTIONS" in the sidebar
2. Name the collection (e.g., "ACON3D Assets" or "Favorite Creator")
3. Select platform
4. Add a description

### Price Tracking
- The app stores the initial price when you add an asset
- Manual price updates coming in Phase 2
- Price history is tracked automatically

## Next Steps (Phase 2)

- **Automatic price scraping** - Check prices automatically
- **Email alerts** - Get notified when prices drop
- **Thumbnail previews** - Display asset images
- **Search & filters** - Find assets quickly
- **Tags** - Custom tagging system
- **Export** - Export your asset list

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add `localhost` if it's not there

**"Module not found" errors**
- Run `npm install` in the yuyu-asset-manager folder

**Can't sign in**
- Make sure you enabled Google authentication in Firebase Console
- Check that your .env.local file has the correct values

**Data not saving**
- Check Firebase Console > Firestore Database
- Make sure the database is created and in "test mode"

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Hosting**: Can deploy to Vercel (free tier)

## Support

Need help? Check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

Have fun tracking your assets!

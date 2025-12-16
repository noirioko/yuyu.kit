# MyPebbles Features

## Core Features

### Asset Management
- **Save assets from multiple platforms** - ACON3D, Clip Studio Paint Assets, Gumroad, itch.io, Booth.pm, Unity Asset Store, Sketchfab, Amazon, and more
- **One-click save** - Browser extension saves asset details automatically (title, price, thumbnail, creator, tags)
- **Track asset status** - Mark assets as Wishlist, Bought, or In Use
- **Price tracking** - Records current price, original price, and lowest seen price
- **Sale detection** - Automatically detects when assets are on sale with discount percentage
- **Duplicate detection** - Warns when trying to save an asset you already have

### Organization
- **Projects** - Group assets by project (e.g., "Game Project", "Commission Work")
- **Collections** - Create themed collections (e.g., "Favorite Brushes", "Character Assets")
- **Tags** - Add custom tags to assets for easy filtering
- **Auto-tagging** - Automatically generates tags based on asset title and description
- **Color-coded** - Projects and collections have customizable colors

### Views & Filtering
- **All Assets** - View everything in one place
- **By Status** - Filter by Wishlist, Bought, or In Use
- **By Project** - See all assets for a specific project
- **By Collection** - Browse your curated collections
- **By Tags** - Dedicated tag browser page
- **Search** - Search across all assets by title, creator, or tags
- **Sorting** - Sort by date added, price, title, or status

### Dashboard Features
- **Grid view** - Visual card layout with thumbnails
- **Pagination** - 50 assets per page for smooth performance
- **Quick actions** - Edit, delete, or open original URL
- **Drag & drop** - Drag assets to projects/collections in sidebar
- **Bulk actions** - Auto-tag all assets at once

## Browser Extension

### Supported Platforms
- ACON3D (acon3d.com)
- Clip Studio Paint Assets (assets.clip-studio.com)
- Gumroad (gumroad.com)
- itch.io (itch.io)
- Booth.pm (booth.pm)
- Unity Asset Store (assetstore.unity.com)
- Sketchfab (sketchfab.com)
- Amazon (amazon.com, amazon.co.jp, etc.)
- Generic support for other sites via meta tags

### Extension Features
- **Auto-detection** - Automatically extracts asset info from page
- **Manual override** - Edit any field before saving
- **Project selection** - Choose which project to save to
- **Status selection** - Set initial status (Wishlist/Bought/In Use)
- **Tag input** - Add tags while saving
- **Notes** - Add personal notes to assets

## User Experience

### Themes
- **Day Mode** - Light, clean interface
- **Night Mode** - Dark theme for late-night browsing

### Responsive Design
- **Desktop** - Full sidebar navigation
- **Mobile** - Slide-out drawer menu
- **Touch-friendly** - Works on tablets

### Profile & Account
- **Google Sign-in** - Quick and secure authentication
- **Profile page** - View stats and subscription status
- **User ID** - Copy for extension setup
- **Data export** - Your data is yours (Firebase)

## Subscription & Pricing

### Free Tier
- Up to 50 assets
- Up to 3 projects
- Unlimited collections
- Full browser extension access
- All core features

### Premium (Lifetime $9.99)
- **Unlimited** assets
- **Unlimited** projects
- Unlimited collections
- Lifetime access
- Support development

## Technical Features

### Data & Security
- **Firebase Authentication** - Secure Google OAuth
- **Firestore Database** - Real-time sync across devices
- **User isolation** - Only you can see your data
- **Delete all data** - One-click account data deletion

### Performance
- **Pagination** - Handles large collections smoothly
- **Lazy loading** - Images load as needed
- **Real-time updates** - Changes sync instantly
- **Offline support** - View cached data offline

## Pages

- `/` - Dashboard (main app)
- `/tags` - Tag browser
- `/overview` - Statistics and insights
- `/profile` - User profile and settings
- `/upgrade` - Premium upgrade page
- `/about` - About MyPebbles
- `/privacy` - Privacy policy

---

## Roadmap Ideas (Future)
- Price drop notifications
- Import/export data
- Shared collections
- Mobile app
- More platform integrations
- Browser extension for Firefox

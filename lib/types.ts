export interface Asset {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;

  // Price tracking
  currentPrice?: number;
  originalPrice?: number; // Original price before discount
  currency?: string;
  isOnSale?: boolean; // Whether the item is currently on sale
  lastPriceCheck?: Date;
  priceHistory: PricePoint[];
  lowestPrice?: number;

  // Organization
  projectId?: string;
  collectionId?: string;
  tags: string[];

  // Purchase status
  status: 'wishlist' | 'bought' | 'in-use';
  purchaseDate?: Date;
  fileLocation?: string; // Where the file is saved on user's computer

  // Metadata
  creator?: string;
  platform?: string; // 'ACON3D', 'Gumroad', 'ArtStation', etc.

  // Personal notes and reviews
  personalNotes?: string; // User's thoughts, reviews, why they want/bought it
  personalRating?: number; // 1-5 star rating for bought assets

  createdAt: Date;
  updatedAt: Date;
}

export interface PricePoint {
  price: number;
  currency: string;
  checkedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  assetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  userId: string;
  name: string; // Creator name or store name
  description?: string;
  platform?: string;
  color?: string;
  assetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;

  // Settings
  priceAlerts: boolean;
  emailNotifications: boolean;
}

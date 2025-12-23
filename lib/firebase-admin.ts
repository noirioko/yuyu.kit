import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Check if we have service account credentials
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        console.error('Failed to parse service account JSON:', error);
        // Fall back to default credentials
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
    } else {
      // Use application default credentials (works in Google Cloud)
      // Or use project ID only (limited functionality)
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
  return { adminApp, adminDb };
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb!;
}

export { adminApp, adminDb };

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize the Firebase Admin SDK if not already initialized
// We can verify tokens with just the Project ID, no need for the private key credentials.
const app = getApps().length === 0 ? initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}) : getApp();

export const adminAuth = getAuth(app);

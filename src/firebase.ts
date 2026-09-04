import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

// Use environment variables if available, otherwise fallback to JSON config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with robust connection settings (auto-detect long polling) & multi-tab cache
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    localCache: typeof window !== 'undefined'
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : undefined
  },
  firebaseConfig.firestoreDatabaseId
);

export const storage = getStorage(app);
storage.maxUploadRetryTime = 3000;
storage.maxOperationRetryTime = 3000;
export const googleProvider = new GoogleAuthProvider();

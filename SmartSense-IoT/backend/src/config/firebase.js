import admin from 'firebase-admin';
import config from './env.js';

let firebaseApp = null;
let firebaseDb = null;
let isInitialized = false;

if (!config.useMockFirebase && config.firebase.privateKey && config.firebase.clientEmail) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      databaseURL: config.firebase.databaseUrl,
    });
    firebaseDb = admin.database();
    isInitialized = true;
    console.log('[FIREBASE] Firebase Admin SDK initialized successfully');
  } catch (err) {
    console.warn('[FIREBASE] Firebase Admin initialization warning (falling back):', err.message);
  }
} else {
  console.log('[FIREBASE] Running in Local / Test Database Mode');
}

export { admin, firebaseApp, firebaseDb, isInitialized };
export default firebaseDb;

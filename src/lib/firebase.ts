import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyBCNwTlYqScaD3o_FFycpX6u-M7PCXysc0",
  authDomain: firebaseAppletConfig.authDomain || "gen-lang-client-0961551337.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "gen-lang-client-0961551337",
  storageBucket: firebaseAppletConfig.storageBucket || "gen-lang-client-0961551337.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "442919512066",
  appId: firebaseAppletConfig.appId || "1:442919512066:web:2ca4cdb492eeba1ad49f1b"
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId || "aeo-database19";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, databaseId);
} catch (e) {
  console.warn("Failed to initialize with custom database ID, using fallback:", e);
  firestoreDb = getFirestore(app, databaseId);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();


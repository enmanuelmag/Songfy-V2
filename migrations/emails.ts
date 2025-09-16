import * as path from 'node:path';

import { initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore';

import { BUDGETS_COLLECTION } from '@constants/datasource';

import * as dotenv from 'dotenv';

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: false,
});

const androidFirebaseConfig = {
  clientId: process.env.FIREBASE_ANDROID_CLIENT_ID,
  appId: process.env.FIREBASE_ANDROID_APP_ID,
  apiKey: process.env.FIREBASE_ANDROID_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.FIREBASE_PROJECT_ID,
  packageName: process.env.FIREBASE_ANDROID_PACKAGE_NAME,
};

const main = async () => {
  const db = getFirestore();

  const col = collection(db, BUDGETS_COLLECTION);

  const docs = await getDocs(col);

  const batch = writeBatch(db);
  docs.forEach((doc) => {
    batch.update(doc.ref, {
      emailsFrom: [],
      emailsUser: [],
    });

    console.log(`Updated emails for budget ${doc.ref.id}`);
  });
  await batch.commit();

  console.log(`Updated emails for all budgets`);
};

initializeApp(androidFirebaseConfig);

main()
  .then(() => {
    console.log(`Migration completed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Migration failed: ${error}`);
    process.exit(1);
  });

import { v4 as uuidv4 } from 'uuid';

import { Platform } from 'react-native';

import { initializeApp } from '@react-native-firebase/app';
import {
  // browserLocalPersistence,
  // browserPopupRedirectResolver,
  initializeAuth,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  // persistentLocalCache,
  // persistentMultipleTabManager,
  query,
  where,
} from '@react-native-firebase/firestore';
import {
  deleteObject,
  getBlob,
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  uploadString,
} from '@react-native-firebase/storage';

import { Logger } from './log';

import type { ReactNativeFirebase } from '@react-native-firebase/app';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { FirebaseStorageTypes } from '@react-native-firebase/storage';

// Puedes importar las variables usando process.env o tu gestor de variables de entorno preferido

const iosFirebaseConfig = {
  clientId: process.env.FIREBASE_IOS_CLIENT_ID,
  appId: process.env.FIREBASE_IOS_APP_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // reversedClientId: process.env.FIREBASE_REVERSED_CLIENT_ID,
  // gcmSenderId: process.env.FIREBASE_GCM_SENDER_ID,
  // bundleId: process.env.FIREBASE_BUNDLE_ID,
};

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

const credentials = Platform.select({
  android: androidFirebaseConfig,
  ios: iosFirebaseConfig,
});

const buildFirestore = async (app: ReactNativeFirebase.FirebaseApp) => {
  try {
    const firestore = await initializeFirestore(
      app,
      {
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
      },
      '(default)'
    );

    Logger.info('Firestore initialized successfully');
    return firestore;
  } catch {
    Logger.error('Error initializing Firestore');
    throw new Error(
      'Error initializing Firestore. Please check your Firebase configuration.'
    );
  }
};

declare global {
  // eslint-disable-next-line no-unused-vars
  var RNFB_MODULAR_DEPRECATION_STRICT_MODE: boolean | undefined;
}

initializeApp(credentials || iosFirebaseConfig)
  .then((app) => {
    initializeAuth(app);

    buildFirestore(app);
  })
  .then(() => {
    globalThis.RNFB_MODULAR_DEPRECATION_STRICT_MODE === true;
  });

// export const auth = initializeAuth(app);

// export const firestore = await buildFirestore(app);

// export const storage = getStorage(app);

// Utils
export const parseEntityToRef = <T extends { id: string }>(
  collectionName: string,
  entity: T
) => {
  const userRef = doc(getFirestore(), collectionName, entity.id);

  return userRef as FirebaseFirestoreTypes.DocumentReference<T>;
};

export const parseRefToEntity = async <T>(
  _ref?: FirebaseFirestoreTypes.DocumentReference | null
) => {
  try {
    if (!_ref) {
      return null;
    }

    const entitySnap = await getDoc(_ref);

    if (!entitySnap.exists()) {
      return null;
    }

    return entitySnap.data() as T;
  } catch (error) {
    console.error('Error getting entity', error);
    throw error;
  }
};

export const parseFieldsBase64 = (base64: string) => {
  const fields = base64.split(';');

  const contentType = fields[0].split(':')[1];

  const data = fields[1].split(',')[1];

  return { contentType, data };
};

export const getURLAttachment = async (
  storageRef: FirebaseStorageTypes.Reference
) => {
  try {
    return await getDownloadURL(storageRef);
  } catch (error) {
    Logger.error('Error getting attachment', error);
  }
};

type UploadAttachmentParams = {
  entity: 'rawMaterial' | 'commit' | 'geoCheckpoint' | 'tool' | 'commitTool';
  entityId: string;
  base64: string;
};

export const uploadAttachment = async (params: UploadAttachmentParams) => {
  const { entity, entityId, base64 } = params;

  const { contentType, data } = parseFieldsBase64(base64);

  const attachmentPath = `${entity}/${entityId}/${uuidv4()}.${contentType.replace('image/', '')}`;

  const fileRef = ref(getStorage(), attachmentPath);

  await uploadString(fileRef, data, 'base64', {
    contentType,
  });

  const url = await getURLAttachment(fileRef);

  if (!url) {
    throw new Error('Failed to get attachment URL');
  }

  return url;
};

export const getComposedIDs = (entityID: string, itemId: string) =>
  `${entityID}-${itemId}`;

type DeleteAttachmentParams = {
  attachmentsPath: Array<string>;
};

export const deleteAttachments = async (params: DeleteAttachmentParams) => {
  const { attachmentsPath } = params;
  for (const attachment of attachmentsPath) {
    const fileRef = ref(getStorage(), attachment);

    await deleteObject(fileRef);
  }
};

export const downloadAttachment = async (url: string, filename: string) => {
  const fileRef = ref(getStorage(), url);

  const metadata = await getMetadata(fileRef);

  const blob = await getBlob(fileRef);

  const contentType = metadata.contentType || 'image/*';

  const element = document.createElement('a');

  element.href = URL.createObjectURL(blob);
  element.download = `${filename}.${contentType.split('/')[1]}`;
  element.click();
};

export const validateIdentifier = async (
  collectionName: string,
  identifier: string
) => {
  const collectionRef = collection(getFirestore(), collectionName);

  const q = query(collectionRef, where('identifier', '==', identifier));

  const snap = await getDocs(q);

  return snap.empty;
};

export const getBase64Image = async (url?: string) => {
  if (!url) {
    return '';
  }

  const response = await fetch(url);

  const blob = await response.blob();

  const base = await new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.readAsDataURL(blob);
  });

  return base;
};

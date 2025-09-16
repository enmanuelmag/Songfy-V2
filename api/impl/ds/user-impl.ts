import 'react-native-get-random-values';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';


import UserDS from '@api/domain/ds/user-ds';
import {
  AUTH_METHODS,
  AUTH_METHOD_KEY,
  BUDGETS_COLLECTION,
  CATEGORIES_COLLECTION,
  CHARGES_COLLECTION,
  CHECK_BIOMETRIC,
  FIREBASE_ID_TOKEN,
  SECRET_EMAIL,
  SECRET_PASSWORD,
  USERS_COLLECTION,
} from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import auth from '@react-native-firebase/auth';
import crashlytics from '@react-native-firebase/crashlytics';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  where,
} from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Logger } from '@utils/log';

import type { AuthMethodType } from '@constants/datasource';
import type {
  ChargesFirebaseType,
  DebtorsFirebaseType,
} from '@customTypes/charges';
import type { UserType } from '@customTypes/user';

const ConfigCredentials = {
  firebaseProviders: {
    webClientId:
      '883439373727-26vmrg448bpg24f1apcuhh5oe6obpjds.apps.googleusercontent.com', // process.env.EXPO_PUBLIC_ANDROID_FIREBASE_CLIENT_ID,
  },
};

// const CACHE_SIZE_BYTES = 512 * 1024 * 1024;

const firestore = getFirestore();

class UserImpl extends UserDS {
  static instance?: UserImpl;

  constructor() {
    super();
  }

  static getInstance() {
    if (!UserImpl.instance) {
      UserImpl.instance = new UserImpl();
    }

    return UserImpl.instance;
  }

  @handleError('Error getting user')
  async signinWithGoogle() {
    GoogleSignin.configure({
      webClientId: ConfigCredentials.firebaseProviders.webClientId,
    });

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const { type, data } = await GoogleSignin.signIn();

    if (type !== 'success') {
      throw new Error('Error signing in with Google: ' + type);
    }

    const { idToken } = data;

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    const { user: userGoogle } =
      await auth().signInWithCredential(googleCredential);
    const user: UserType = {
      displayName: userGoogle.displayName,
      email: userGoogle.email,
      uid: userGoogle.uid,
      type: 'google',
      metadata: {},
    };

    return user;
  }

  @handleError('Error signing in with Apple')
  async signinWithApple() {
    const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken } = appleAuthRequestResponse;
    if (!identityToken) {
      throw new Error('No authorization code returned');
    }

    const appleCredential = auth.AppleAuthProvider.credential(identityToken);

    // Sign the user in with the credential
    const { user: userApple } =
      await auth().signInWithCredential(appleCredential);

    const user: UserType = {
      displayName:
        userApple.displayName ?? appleAuthRequestResponse.fullName?.givenName,
      email: userApple.email ?? appleAuthRequestResponse.email,
      uid: userApple.uid,
      type: 'apple',
      metadata: {},
    };

    return user;
  }

  @handleError('Error signing in anonymously')
  async signinAnonymously() {
    const { user: userSDK } = await auth().signInAnonymously();

    const user: UserType = {
      displayName: userSDK.displayName,
      email: userSDK.email,
      uid: userSDK.uid,
      type: 'anonymous',
      metadata: {},
    };

    const idTokenFirebase = await userSDK.getIdToken();

    await SecureStore.setItemAsync(FIREBASE_ID_TOKEN, idTokenFirebase);

    await SecureStore.setItemAsync(AUTH_METHOD_KEY, AUTH_METHODS.anonymous);

    crashlytics().setUserId(user.uid);
    crashlytics().log('User logged in anonymously');

    return user;
  }

  @handleError('Error checking if user is logged in')
  async checkBiometric(): Promise<boolean> {
    const checkBiometricSecret =
      await SecureStore.getItemAsync(CHECK_BIOMETRIC);

    if (!checkBiometricSecret) {
      return true;
    }

    const resultAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
    });

    if (!resultAuth.success) {
      return false;
    }

    return true;
  }

  @handleError('Error checking if user is logged in')
  async setCheckBiometric(value: boolean) {
    if (value) {
      await SecureStore.setItemAsync(CHECK_BIOMETRIC, value.toString());
    } else {
      await SecureStore.deleteItemAsync(CHECK_BIOMETRIC);
    }
    return value;
  }

  @handleError('Error getting check biometric')
  async getCheckBiometric() {
    const checkBiometricSecret =
      await SecureStore.getItemAsync(CHECK_BIOMETRIC);

    return Boolean(checkBiometricSecret);
  }

  @handleError('Error signing in with email and password')
  async signinWithEmailAndPassword(email: string, password: string) {
    const { user: userSDK } = await auth().signInWithEmailAndPassword(
      email,
      password
    );

    const user: UserType = {
      displayName: userSDK.displayName,
      email: userSDK.email,
      uid: userSDK.uid,
      type: 'email',
      metadata: {},
    };

    const idTokenFirebase = await userSDK.getIdToken();

    await SecureStore.setItemAsync(FIREBASE_ID_TOKEN, idTokenFirebase);

    await SecureStore.setItemAsync(AUTH_METHOD_KEY, AUTH_METHODS.email);

    await SecureStore.setItemAsync(SECRET_EMAIL, email);

    await SecureStore.setItemAsync(SECRET_PASSWORD, password);

    crashlytics().setUserId(user.uid);
    crashlytics().log('User logged in');

    return user;
  }

  @handleError('Error signing in with email and password')
  async signUpWithEmailAndPassword(email: string, password: string) {
    const { user: userSDK } = await auth().createUserWithEmailAndPassword(
      email,
      password
    );

    const user: UserType = {
      displayName: userSDK.displayName,
      email: userSDK.email,
      uid: userSDK.uid,
      type: 'email',
      metadata: {},
    };

    const idTokenFirebase = await userSDK.getIdToken();

    await SecureStore.setItemAsync(FIREBASE_ID_TOKEN, idTokenFirebase);

    await SecureStore.setItemAsync(AUTH_METHOD_KEY, AUTH_METHODS.email);

    await SecureStore.setItemAsync(SECRET_EMAIL, email);

    await SecureStore.setItemAsync(SECRET_PASSWORD, password);

    crashlytics().setUserId(user.uid);
    crashlytics().log('User registered');

    return user;
  }

  @handleError('Error signing in with local authentication')
  async signInWithLocalAuth() {
    const reusltAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
    });

    if (!reusltAuth.success) {
      if (reusltAuth.error === 'user_cancel') {
        throw new Error('User cancelled authentication');
      }
      throw new Error('Error authenticating user');
    }

    const method = await SecureStore.getItemAsync(AUTH_METHOD_KEY);

    const methodCast = method as AuthMethodType;

    let user: UserType | null = null;

    if (methodCast === 'email') {
      const emailSecret = await SecureStore.getItemAsync(SECRET_EMAIL);

      const passwordSecret = await SecureStore.getItemAsync(SECRET_PASSWORD);

      if (!emailSecret || !passwordSecret) {
        throw new Error('Email or password not found in secure store');
      }

      const response = await auth().signInWithEmailAndPassword(
        emailSecret,
        passwordSecret
      );

      user = {
        displayName: response.user.displayName,
        email: response.user.email,
        uid: response.user.uid,
        metadata: {},
        type: 'email',
      };
    } else {
      throw new Error(`Unsupported authentication method: ${methodCast}`);
    }

    crashlytics().setUserId(user.uid);
    crashlytics().log('User logged in with id token');

    return user;
  }

  parseProviderId(providerId: string): AuthMethodType {
    if (providerId.includes('password')) {
      return 'email';
    } else if (providerId.includes('google')) {
      return 'google';
    } else if (providerId.includes('apple')) {
      return 'apple';
    }
    return 'anonymous';
  }

  @handleError('Error getting user from Firebase')
  async getUser() {
    const user = auth().currentUser;

    if (!user) {
      throw new Error('User not found');
    }

    // const userRef = firestore().collection(USERS_COLLECTION).doc(user.uid);

    const userRef = doc(firestore, USERS_COLLECTION, user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found in Firestore');
    }

    const userDataFromFirestore = userSnap.data() as UserType;

    const userData: UserType = {
      displayName: user.displayName || null,
      metadata: userDataFromFirestore.metadata,
      type: this.parseProviderId(user.providerData[0].providerId),
      email: user.email || userDataFromFirestore.email || null,
      uid: user.uid,
    };

    return userData;
  }

  async logout() {
    try {
      await auth().signOut();
    } catch (error) {
      Logger.error('Error logout', error);
      throw new Error('Error logging out');
    }
  }

  @handleError('Error getting user from Firebase')
  async deleteAccount() {
    const user = auth().currentUser;

    if (!user) {
      Logger.error('User not found');
      throw new Error('User not found');
    }

    await runTransaction(firestore, async (transaction) => {
      // 1. Delete all budgets
      // const budgetsSnap = await firestore()
      //   .collection(BUDGETS_COLLECTION)
      //   .where('userId', '==', user.uid)
      //   .get();

      const budgetsSnap = await getDocs(
        query(
          collection(firestore, BUDGETS_COLLECTION),
          where('userId', '==', user.uid)
        )
      );

      for (const budget of budgetsSnap.docs) {
        transaction.delete(budget.ref);
      }

      // 2. Delete all categories
      // const categoriesSnap = await firestore()
      //   .collection(CATEGORIES_COLLECTION)
      //   .where('userId', '==', user.uid)
      //   .get();

      const categoriesSnap = await getDocs(
        query(
          collection(firestore, CATEGORIES_COLLECTION),
          where('userId', '==', user.uid)
        )
      );

      for (const categorySnap of categoriesSnap.docs) {
        transaction.delete(categorySnap.ref);
      }

      // 3. Delete all charges
      // const chargesSnap = await firestore()
      //   .collection(CHARGES_COLLECTION)
      //   .where('userId', '==', user.uid)
      //   .get();

      const chargesSnap = await getDocs(
        query(
          collection(firestore, CHARGES_COLLECTION),
          where('userId', '==', user.uid)
        )
      );

      for (const chargeSnap of chargesSnap.docs) {
        const chargeData = chargeSnap.data() as ChargesFirebaseType;

        // 4. Delete all debtors
        for (const debtorRef of chargeData.debtors) {
          const debtorSnap = await getDoc(debtorRef);

          if (!debtorSnap.exists()) continue;

          const debtorData = debtorSnap.data() as DebtorsFirebaseType;

          // 5. Delete all payments
          for (const paymentRef of debtorData.payments) {
            transaction.delete(paymentRef);
          }

          transaction.delete(debtorRef);
        }

        transaction.delete(chargeSnap.ref);
      }

      await user.delete();
    });
  }
}

export default UserImpl;

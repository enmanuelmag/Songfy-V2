import 'react-native-get-random-values';

import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';


import DataDS from '@api/domain/ds/data-ds';
import { DefaultCategories } from '@constants/budget';
import {
  AUTH_METHODS,
  AUTH_METHOD_KEY,
  BUDGETS_COLLECTION,
  CATEGORIES_COLLECTION,
  CHARGES_COLLECTION,
  CHECK_BIOMETRIC,
  DEBTORS_COLLECTION,
  FIREBASE_ID_TOKEN,
  PAYMENTS_COLLECTION,
  SECRET_EMAIL,
  SECRET_PASSWORD,
  USERS_COLLECTION,
} from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import auth from '@react-native-firebase/auth';
import crashlytics from '@react-native-firebase/crashlytics';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { isArchivedEvent } from '@utils/budget';
import { ErrorCodes, ErrorService } from '@utils/errors';
import { Logger } from '@utils/log';
import { cancelNotification, scheduleNotification } from '@utils/notifications';
import { isAndroid, isIOS } from '@utils/platform';

import type { AuthMethodType } from '@constants/datasource';
import type {
  BudgetBaseCreateType,
  BudgetBaseType,
  BudgetExtendedType,
  BudgetFirebaseType,
  BulkToggleCompletedEventParamsType,
  CategoryCreateType,
  CategoryType,
  EventBaseType,
  EventFirebaseType,
  ToggleCompletedEventParamsType,
} from '@customTypes/budget';
import type {
  AddDebtorParamsType,
  AddPaymentParamsType,
  ChargeType,
  ChargesFirebaseType,
  DebtorType,
  DebtorsFirebaseType,
  DeleteDebtorParamsType,
  DeletePaymentParamsType,
  PaymentFileParamsType,
  PaymentFileType,
  PaymentFirebaseType,
  PaymentType,
  UpdateDebtorParamsType,
  UpdatePaymentParamsType,
} from '@customTypes/charges';
import type { UserType } from '@customTypes/user';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type * as Notifications from 'expo-notifications';

const ConfigCredentials = {
  firebaseProviders: {
    webClientId:
      '883439373727-26vmrg448bpg24f1apcuhh5oe6obpjds.apps.googleusercontent.com', // process.env.EXPO_PUBLIC_ANDROID_FIREBASE_CLIENT_ID,
  },
};

const CACHE_SIZE_BYTES = 512 * 1024 * 1024;

class FirebaseDS extends DataDS {
  constructor() {
    super();
    firestore().settings({
      persistence: true,
      ignoreUndefinedProperties: true,
      cacheSizeBytes: CACHE_SIZE_BYTES,
    });
    // GoogleSignin.configure(ConfigCredentials.firebaseProviders);
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
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_LOCAL_AUTH);
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
        throw ErrorService.getErrorFromCode(
          ErrorCodes.ERROR_LOCAL_AUTH_CANCELLED
        );
      }
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_LOCAL_AUTH);
    }

    const method = await SecureStore.getItemAsync(AUTH_METHOD_KEY);

    const methodCast = method as AuthMethodType;

    let user: UserType | null = null;

    if (methodCast === 'email') {
      const emailSecret = await SecureStore.getItemAsync(SECRET_EMAIL);

      const passwordSecret = await SecureStore.getItemAsync(SECRET_PASSWORD);

      if (!emailSecret || !passwordSecret) {
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_NOT_FIRST_SIGN_IN);
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
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_NOT_FIRST_SIGN_IN);
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

    const userRef = firestore().collection(USERS_COLLECTION).doc(user.uid);

    const userSnap = await userRef.get();

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
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_LOGOUT);
    }
  }

  @handleError('Error getting user from Firebase')
  async deleteAccount() {
    const user = auth().currentUser;

    if (!user) {
      Logger.error('User not found');
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_USER);
    }

    await firestore().runTransaction(async (transaction) => {
      // 1. Delete all budgets
      const budgetsSnap = await firestore()
        .collection(BUDGETS_COLLECTION)
        .where('userId', '==', user.uid)
        .get();

      for (const budget of budgetsSnap.docs) {
        transaction.delete(budget.ref);
      }

      // 2. Delete all categories
      const categoriesSnap = await firestore()
        .collection(CATEGORIES_COLLECTION)
        .where('userId', '==', user.uid)
        .get();

      for (const categorySnap of categoriesSnap.docs) {
        transaction.delete(categorySnap.ref);
      }

      // 3. Delete all charges
      const chargesSnap = await firestore()
        .collection(CHARGES_COLLECTION)
        .where('userId', '==', user.uid)
        .get();

      for (const chargeSnap of chargesSnap.docs) {
        const chargeData = chargeSnap.data() as ChargesFirebaseType;

        // 4. Delete all debtors
        for (const debtorRef of chargeData.debtors) {
          const debtorSnap = await debtorRef.get();

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

  async getCategoryFromEvent(event: EventFirebaseType) {
    try {
      if (!event.category) {
        return null;
      }

      const categorySnap = await event.category.get();

      const category = categorySnap.exists()
        ? (categorySnap.data() as CategoryType)
        : null;

      return category;
    } catch (error) {
      Logger.error('Error getting category from event', error);

      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_CATEGORIES);
    }
  }

  parseCategoryToRef(category: CategoryType) {
    try {
      const categoryRef = firestore()
        .collection(CATEGORIES_COLLECTION)
        .doc(category.id);

      return categoryRef;
    } catch (error) {
      Logger.error('Error parsing category to ref', error);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_CATEGORIES);
    }
  }

  // Budgets
  segregateEvents(parsedEvents: Array<EventBaseType>) {
    const events: Array<EventBaseType> = [];
    const eventsArchived: Array<EventBaseType> = [];

    for (const event of parsedEvents) {
      const isArchived = isArchivedEvent(event);

      if (isArchived) {
        eventsArchived.push(event);
      } else {
        events.push(event);
      }
    }

    events.sort((a, b) => b.date - a.date);

    eventsArchived.sort((a, b) => b.date - a.date);

    return { events, eventsArchived };
  }

  @handleError('Error getting budgets')
  async getBudgets() {
    const user = await this.getUser();

    const budgetsSnap = await firestore()
      .collection(BUDGETS_COLLECTION)
      .where('userId', '==', user.uid)
      .where('deleted', '==', false)
      .get();

    const parsedBudgets: Array<BudgetExtendedType> = [];

    const budgetsData = budgetsSnap.docs.map(
      (doc) => doc.data() as BudgetFirebaseType
    );

    for (const budget of budgetsData) {
      // const budgetCache = queryClient.getQueryData<BudgetExtendedType>([
      //   GET_BUDGET_KEY,
      //   budgetsData[idx].id,
      // ]);

      // if (budgetCache) {
      //   parsedBudgets.push(budgetCache);
      //   continue;
      // }

      const parsedEvents: Array<EventBaseType> = [];

      for (const event of budget.events) {
        parsedEvents.push({
          ...event,
          category: await this.getCategoryFromEvent(event),
        });
      }

      const { events, eventsArchived } = this.segregateEvents(parsedEvents);

      const budgetExtended: BudgetExtendedType = {
        ...budget,
        events,
        eventsArchived,
      };

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetExtended.id], budgetExtended);

      parsedBudgets.push(budgetExtended);
    }

    return parsedBudgets;
  }

  @handleError('Error getting budget')
  async getBudget(id: string) {
    // const cachedBudget = queryClient.getQueryData<BudgetExtendedType>([GET_BUDGET_KEY, id]);

    // if (cachedBudget) {
    //   return cachedBudget;
    // }

    const budgetSnap = await firestore()
      .collection(BUDGETS_COLLECTION)
      .doc(id)
      .get();

    if (!budgetSnap.exists()) {
      Logger.error(`Budget with id ${id} not found`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
    }

    const budgetData = budgetSnap.data() as BudgetFirebaseType;

    const parsedEvents: Array<EventBaseType> = [];

    for (const event of budgetData.events) {
      parsedEvents.push({
        ...event,
        category: await this.getCategoryFromEvent(event),
      });
    }

    const { events, eventsArchived } = this.segregateEvents(parsedEvents);

    const budget: BudgetExtendedType = {
      ...budgetData,
      events,
      eventsArchived,
    };

    if (budget.deleted) {
      Logger.error(`Budget with id ${id} is deleted`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
    }

    return budget;
  }

  buildTriggerByPlatform(event: EventBaseType) {
    const { repeat, timeNotification, date } = event;
    const { hour, minute } = timeNotification;

    const dateMoment = moment.unix(date);

    if (isIOS) {
      const trigger = {
        hour,
        minute,
      } as Record<string, unknown>;

      if (repeat.isAlways) {
        trigger.repeats = true;
      }
      if (repeat.type === 'week') {
        trigger.weekday = dateMoment.day();
      } else if (repeat.type === 'month') {
        trigger.day = dateMoment.date();
      } else if (repeat.type === 'year') {
        trigger.month = dateMoment.month();
        trigger.day = dateMoment.date();
      } else if (repeat.type === 'unique') {
        trigger.year = dateMoment.year();
        trigger.month = dateMoment.month();
        trigger.day = dateMoment.date();
      }
      // else {
      //   return moment.unix(date).set({ hour, minute }).toDate();
      // }

      return trigger;
    } else if (isAndroid) {
      if (repeat.isAlways) {
        if (repeat.type === 'day') {
          return {
            repeats: true,
            hour,
            minute,
          };
        } else if (repeat.type === 'week') {
          return {
            repeats: true,
            hour,
            minute,
            weekday: dateMoment.day(),
          };
        } else if (repeat.type === 'month') {
          return {
            repeats: true,
            seconds: moment
              .unix(date)
              .set({ hour, minute })
              .diff(moment(), 'seconds'),
          };
        } else if (repeat.type === 'year') {
          return {
            repeats: true,
            day: dateMoment.date(),
            month: dateMoment.month(),
            hour,
            minute,
          };
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (repeat.type === 'unique') {
          return {
            repeats: false,
            seconds: moment
              .unix(date)
              .set({ hour, minute })
              .diff(moment(), 'seconds'),
          };
        }
      } else {
        return {
          repeats: false,
          seconds: moment
            .unix(date)
            .set({ hour, minute })
            .diff(moment(), 'seconds'),
        };
      }
    }
  }

  async scheduleEventNotification(event: EventBaseType) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!event.timeNotification?.enabled) return;

    const { id } = event;

    const trigger = this.buildTriggerByPlatform(
      event
    ) as Notifications.NotificationTriggerInput;

    await scheduleNotification({
      id: `${event.name}-${id}`,
      title: event.name,
      body: 'Your event is happening today!',
      data: {
        entity: 'event',
        data: event,
      },
      trigger,
    });
  }

  @handleError('Error creating budget')
  async createBudget(budget: BudgetBaseCreateType) {
    const user = await this.getUser();

    const budgetBase: BudgetBaseType = {
      ...budget,
      id: uuidv4(),
      deleted: false,
      userId: user.uid,
    };

    const eventFirebase: Array<EventFirebaseType> = [];

    for (const event of budgetBase.events) {
      eventFirebase.push({
        ...event,
        category: event.category
          ? this.parseCategoryToRef(event.category)
          : null,
      });
    }

    const budgetFirebase: BudgetFirebaseType = {
      ...budgetBase,
      events: eventFirebase,
    };

    await firestore()
      .collection(BUDGETS_COLLECTION)
      .doc(budgetBase.id)
      .set(budgetFirebase);

    for (const event of budgetBase.events) {
      await this.scheduleEventNotification(event);
    }

    return budgetBase;
  }

  @handleError('Error updating budget')
  async updateBudget(id: string, budgetBase: BudgetBaseType) {
    const eventFirebase: Array<EventFirebaseType> = [];

    for (const event of budgetBase.events) {
      eventFirebase.push({
        ...event,
        category: event.category
          ? this.parseCategoryToRef(event.category)
          : null,
      });
    }

    const budgetFirebase: BudgetFirebaseType = {
      ...budgetBase,
      events: eventFirebase,
    };

    // schedule notifications
    for (const event of budgetBase.events) {
      await this.scheduleEventNotification(event);
    }

    await firestore()
      .collection(BUDGETS_COLLECTION)
      .doc(id)
      .update(budgetFirebase);

    // queryClient.setQueryData([GET_BUDGET_KEY, id], budgetBase);

    return budgetBase;
  }

  @handleError('Error toggling budget completed')
  async toggleEventCompleted(params: ToggleCompletedEventParamsType) {
    const { budgetId, eventId, currentCompleted, targetDate } = params;
    // get a ref of the budget
    const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(budgetId);
    await firestore().runTransaction(async (transaction) => {
      // get the budget data
      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      const currentCompletedDates =
        budget.events[eventIndex].completedDates ?? [];

      let completedDates: Array<number> = [];

      const targetDateMoment = moment.unix(targetDate).startOf('day');

      const event = budget.events[eventIndex];

      if (currentCompleted) {
        // currently completed, so remove the date
        // remove the date from the completed dates
        completedDates = currentCompletedDates.filter(
          (date) => date !== targetDateMoment.unix()
        );

        if (event.type === 'expense') {
          budget.initialBalance += event.amount;
        } else {
          budget.initialBalance -= event.amount;
        }
      } else {
        // currently not completed, so add the date
        // add the date to the completed dates
        completedDates = [...currentCompletedDates, targetDateMoment.unix()];

        if (event.type === 'expense') {
          budget.initialBalance -= event.amount;
        } else {
          budget.initialBalance += event.amount;
        }
      }

      // update the event
      budget.events[eventIndex] = {
        ...budget.events[eventIndex],
        completedDates,
      };

      // update the budget
      transaction.update(budgetRef, budget);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }

  @handleError('Error toggling event balance')
  async toggleEventBalance(params: ToggleCompletedEventParamsType) {
    const { budgetId, eventId, targetDate } = params;
    // get a ref of the budget
    const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(budgetId);
    await firestore().runTransaction(async (transaction) => {
      // get the budget data
      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      const event = budget.events[eventIndex];

      const targetDateMoment = moment.unix(targetDate).startOf('day');

      const currentCompletedDates =
        budget.events[eventIndex].completedDates ?? [];

      let completedDates: Array<number> = [];

      if (currentCompletedDates.includes(targetDateMoment.unix())) {
        // currently completed, so remove the date
        // remove the date from the completed dates
        completedDates = currentCompletedDates.filter(
          (date) => date !== targetDateMoment.unix()
        );

        if (event.type === 'expense') {
          budget.initialBalance += event.amount;
        } else {
          budget.initialBalance -= event.amount;
        }
      } else {
        // currently not completed, so add the date
        // add the date to the completed dates
        completedDates = [...currentCompletedDates, targetDateMoment.unix()];

        if (event.type === 'expense') {
          budget.initialBalance -= event.amount;
        } else {
          budget.initialBalance += event.amount;
        }
      }

      // update the event
      budget.events[eventIndex] = {
        ...budget.events[eventIndex],
        completedDates,
      };

      // update the budget
      transaction.update(budgetRef, budget);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }

  @handleError('Error bulk toggling event balance')
  async bulkToggleEventBalance(params: BulkToggleCompletedEventParamsType) {
    const { budgetId, events } = params;

    await firestore().runTransaction(async (transaction) => {
      const budgetRef = firestore()
        .collection(BUDGETS_COLLECTION)
        .doc(budgetId);

      // const budget = budgetSnap.data() as BudgetFirebaseType;

      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      for (const e of events) {
        const eventIndex = budget.events.findIndex(
          ({ id }) => e.eventId === id
        );

        const event = budget.events[eventIndex];

        let completedDates: Array<number> = [];

        const currentCompletedDates =
          budget.events[eventIndex].completedDates ?? [];

        if (e.toggleType === 'balance') {
          // repliace the logic of toggleEventBalance function here
          const targetDateMoment = moment.unix(e.targetDate).startOf('day');

          if (currentCompletedDates.includes(targetDateMoment.unix())) {
            // currently completed, so remove the date
            // remove the date from the completed dates
            completedDates = currentCompletedDates.filter(
              (date) => date !== targetDateMoment.unix()
            );

            if (event.type === 'expense') {
              budget.initialBalance += event.amount;
            } else {
              budget.initialBalance -= event.amount;
            }
          } else {
            // currently not completed, so add the date
            // add the date to the completed dates
            completedDates = [
              ...currentCompletedDates,
              targetDateMoment.unix(),
            ];

            if (event.type === 'expense') {
              budget.initialBalance -= event.amount;
            } else {
              budget.initialBalance += event.amount;
            }
          }
        } else {
          const targetDateMoment = moment.unix(e.targetDate).startOf('day');

          if (e.currentCompleted) {
            // currently completed, so remove the date
            // remove the date from the completed dates
            completedDates = currentCompletedDates.filter(
              (date) => date !== targetDateMoment.unix()
            );

            if (event.type === 'expense') {
              budget.initialBalance += event.amount;
            } else {
              budget.initialBalance -= event.amount;
            }
          } else {
            // currently not completed, so add the date
            // add the date to the completed dates
            completedDates = [
              ...currentCompletedDates,
              targetDateMoment.unix(),
            ];

            if (event.type === 'expense') {
              budget.initialBalance -= event.amount;
            } else {
              budget.initialBalance += event.amount;
            }
          }
        }

        budget.events[eventIndex] = {
          ...budget.events[eventIndex],
          completedDates,
        };

        transaction.update(budgetRef, budget);
      }
    });

    return true;
  }

  @handleError('Error deleting budget')
  async deleteBudget(id: string) {
    await firestore().runTransaction(async (transaction) => {
      const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(id);

      const budgetSnap = await transaction.get(budgetRef);

      const budget = budgetSnap.data() as BudgetFirebaseType;

      budget.deleted = true;

      transaction.update(budgetRef, budget);

      // cancel all notifications
      for (const eventEvent of budget.events) {
        await cancelNotification(eventEvent.id);
      }

      // queryClient.removeQueries({
      //   predicate: (query) => [GET_BUDGET_KEY, id].includes(query.queryKey[1] as string),
      // });
    });

    return true;
  }

  @handleError('Error creating event')
  async deleteEvent(budgetId: string, eventId: string) {
    const user = await this.getUser();

    await firestore().runTransaction(async (transaction) => {
      const budgetRef = firestore()
        .collection(BUDGETS_COLLECTION)
        .doc(budgetId);

      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      if (budget.userId !== user.uid) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_BUDGET_NOT_FOUND);
      }

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      if (eventIndex !== -1) {
        budget.events.splice(eventIndex, 1);
      }

      transaction.update(budgetRef, budget);

      await cancelNotification(eventId);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }

  // Categories
  @handleError('Error getting categories')
  async getCategories() {
    const user = await this.getUser();

    const categoriesResponse = new Promise<Array<CategoryType>>((resolve) =>
      firestore().runTransaction(async (transaction) => {
        const userRef = firestore().collection(USERS_COLLECTION).doc(user.uid);

        const userSnap = await userRef.get();

        let userData = userSnap.data() as UserType | undefined;

        if (!userData || !userData.metadata.alreadyDefaultCategories) {
          const newCategories = DefaultCategories.map((category) => ({
            ...category,
            id: uuidv4(),
            userId: user.uid,
          }));

          for (const category of newCategories) {
            await firestore()
              .collection(CATEGORIES_COLLECTION)
              .doc(category.id)
              .set(category);
          }

          userData = {
            ...user,
            metadata: {
              alreadyDefaultCategories: true,
            },
          };

          if (userSnap.exists()) {
            transaction.update(userRef, userData);
          } else {
            transaction.set(userRef, userData);
          }
        }

        const categoriesSnap = await firestore()
          .collection(CATEGORIES_COLLECTION)
          .where('userId', '==', user.uid)
          .orderBy('name')
          .get();

        const categories = categoriesSnap.docs.map(
          (doc) => doc.data() as CategoryType
        );

        resolve(categories);
      })
    );

    return categoriesResponse;
  }

  @handleError('Error getting category')
  async createCategory(category: CategoryCreateType) {
    const user = await this.getUser();

    const categoryBase: CategoryType = {
      ...category,
      id: uuidv4(),
      userId: user.uid,
    };

    await firestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(categoryBase.id)
      .set(categoryBase);

    return categoryBase;
  }

  @handleError('Error updating category')
  async updateCategory(id: string, category: CategoryType) {
    await firestore()
      .collection(CATEGORIES_COLLECTION)
      .doc(id)
      .update(category);

    return category;
  }

  @handleError('Error deleting category')
  async deleteCategory(id: string) {
    await firestore().collection(CATEGORIES_COLLECTION).doc(id).delete();

    return true;
  }

  // Charges
  parseFieldsBase64(base64: string) {
    const fields = base64.split(';');

    const contentType = fields[0].split(':')[1];

    const data = fields[1].split(',')[1];

    return { contentType, data };
  }

  isFirebaseStorageUrl(attachment: string) {
    return attachment.startsWith('https://');
  }

  @handleError('Error parsing base64 to blob')
  async parseBase64ToBlob(paymentId: string, base64?: string | null) {
    if (!base64) return null;

    const { contentType, data } = this.parseFieldsBase64(base64);

    const imageRef = storage().ref(
      `payments/${paymentId}.${contentType.replace('image/', '')}`
    );

    await imageRef.putString(data, 'base64', {
      contentType,
    });

    const urlDownload = await imageRef.getDownloadURL();

    return urlDownload;
  }

  @handleError('Error getting payments from debtor')
  async getPaymentsFromDebtor(debtor: DebtorsFirebaseType) {
    const payments: Array<PaymentType> = [];

    for (const paymentRef of debtor.payments) {
      const paymentSnap = await paymentRef.get();

      if (!paymentSnap.exists()) continue;

      const paymentFirebase = paymentSnap.data() as PaymentFirebaseType;

      const paymentData: PaymentType = {
        ...paymentFirebase,
      };

      // queryClient.setQueryData([GET_PAYMENT_KEY, paymentData.id], paymentData);

      payments.push(paymentData);
    }

    return payments.sort((a, b) => b.date - a.date);
  }

  async parsePaymentToRef(payment: PaymentType) {
    try {
      const paymentRef = firestore()
        .collection(PAYMENTS_COLLECTION)
        .doc(payment.id);

      const paymentSnap = await paymentRef.get();

      if (paymentSnap.exists()) {
        return paymentRef;
      }

      return null;
    } catch (error) {
      Logger.error('Error parsing payment to ref', error);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_PAYMENTS);
    }
  }

  @handleError('Error getting debtor from charge')
  async getDebtorFromCharge(charge: ChargesFirebaseType) {
    const debtors: Array<DebtorType> = [];

    for (const chargeDebtor of charge.debtors) {
      const debtorSnap = await chargeDebtor.get();

      if (!debtorSnap.exists()) continue;

      const debtorData = debtorSnap.data() as DebtorsFirebaseType;

      const payments = await this.getPaymentsFromDebtor(debtorData);

      const debtorExtended: DebtorType = {
        ...debtorData,
        payments,
      };

      // queryClient.setQueryData([GET_DEBTOR_KEY, debtorExtended.id], debtorExtended);

      debtors.push(debtorExtended);
    }

    return debtors;
  }

  async parseDebtorToRef(debtor: DebtorType) {
    try {
      const debtorRef = firestore()
        .collection(DEBTORS_COLLECTION)
        .doc(debtor.id);

      const debtorSnap = await debtorRef.get();

      if (debtorSnap.exists()) {
        return debtorRef;
      }

      return null;
    } catch (error) {
      Logger.error('Error parsing debtor to ref', error);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_DEBTORS);
    }
  }

  @handleError('Error getting charges')
  async getCharges() {
    const user = await this.getUser();

    const chargesSnap = await firestore()
      .collection(CHARGES_COLLECTION)
      .where('userId', '==', user.uid)
      .where('deleted', '==', false)
      .get();

    const chargesData = chargesSnap.docs.map(
      (doc) => doc.data() as ChargesFirebaseType
    );

    const parsedCharges: Array<ChargeType> = [];

    for (const charge of chargesData) {
      // const chargeCached = queryClient.getQueryData<ChargeType>([
      //   GET_CHARGE_KEY,
      //   chargesData[idx].id,
      // ]);

      // if (chargeCached) {
      //   parsedCharges.push(chargeCached);
      //   continue;
      // }

      // const charge = chargesData[idx];

      // const debtors = await this.getDebtorFromCharge(charge);

      // const chargeExtended: ChargeType = {
      //   ...charge,
      //   debtors,
      // };

      // queryClient.setQueryData([GET_CHARGE_KEY, chargeExtended.id], chargeExtended);

      parsedCharges.push({
        ...charge,
        debtors: [],
      });

      // parsedCharges.push(chargeExtended);
    }

    return parsedCharges;
  }

  @handleError('Error getting charge')
  async getCharge(id: string) {
    const chargeSnap = await firestore()
      .collection(CHARGES_COLLECTION)
      .doc(id)
      .get();

    if (!chargeSnap.exists()) {
      Logger.error(`Charge with id ${id} not found`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_CHARGE_NOT_FOUND);
    }

    const chargeData = chargeSnap.data() as ChargesFirebaseType;

    const debtors = await this.getDebtorFromCharge(chargeData);

    const charge: ChargeType = {
      ...chargeData,
      debtors,
    };

    if (charge.deleted) {
      Logger.error(`Charge with id ${id} is deleted`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_CHARGE_NOT_FOUND);
    }

    return charge;
  }

  @handleError('Error creating charge')
  async createCharge(charge: ChargeType) {
    const user = await this.getUser();

    await firestore().runTransaction(async (transaction) => {
      const chargeFirebase: ChargesFirebaseType = {
        ...charge,
        debtors: [],
        userId: user.uid,
      };

      const debtorsRef: Array<FirebaseFirestoreTypes.DocumentReference> = [];

      for (const debtor of charge.debtors) {
        const debtorFirebase: DebtorsFirebaseType = {
          ...debtor,
          payments: [],
        };

        const debtorRef = firestore()
          .collection(DEBTORS_COLLECTION)
          .doc(debtorFirebase.id);

        const checkDebtor = await transaction.get(debtorRef);
        if (!checkDebtor.exists()) {
          transaction.set(debtorRef, debtorFirebase);
        }

        transaction.set(debtorRef, debtorFirebase);

        debtorsRef.push(debtorRef);
      }

      const chargeRef = firestore()
        .collection(CHARGES_COLLECTION)
        .doc(chargeFirebase.id);

      chargeFirebase.debtors = debtorsRef;

      transaction.set(chargeRef, chargeFirebase);
    });

    return charge;
  }

  @handleError('Error updating charge')
  async updateCharge(id: string, charge: Partial<ChargeType>) {
    // only the shallow fields can be updated, those are:
    // name, description, amount, startChargeDate, repeat
    const chargeFirebase: Partial<ChargesFirebaseType> = {};

    if (charge.description) chargeFirebase.description = charge.description;
    if (charge.amount) chargeFirebase.amount = charge.amount;
    if (charge.startChargeDate)
      chargeFirebase.startChargeDate = charge.startChargeDate;
    if (charge.repeat) chargeFirebase.repeat = charge.repeat;

    await firestore()
      .collection(CHARGES_COLLECTION)
      .doc(id)
      .update(chargeFirebase);

    // queryClient.setQueryData([GET_CHARGE_KEY, id], (oldData: ChargeType) => ({
    //   ...oldData,
    //   ...charge,
    // }));

    return true;
  }

  @handleError('Error deleting charge')
  async deleteCharge(id: string) {
    await firestore()
      .collection(CHARGES_COLLECTION)
      .doc(id)
      .update({ deleted: true });

    return true;
  }

  // Debtors
  @handleError('Error getting debtors')
  async getDebtor(id: string): Promise<DebtorType> {
    // const cachedDebtor = queryClient.getQueryData<DebtorType>([GET_DEBTOR_KEY, id]);

    // if (cachedDebtor) {
    //   return cachedDebtor;
    // }

    const debtorSnap = await firestore()
      .collection(DEBTORS_COLLECTION)
      .doc(id)
      .get();

    if (!debtorSnap.exists()) {
      Logger.error(`Debtor with id ${id} not found`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_DEBTOR_NOT_FOUND);
    }

    const debtorData = debtorSnap.data() as DebtorsFirebaseType;

    const payments = await this.getPaymentsFromDebtor(debtorData);

    const debtor: DebtorType = {
      ...debtorData,
      payments,
    };

    if (debtor.deleted) {
      Logger.error(`Debtor with id ${id} is deleted`);
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_DEBTOR_NOT_FOUND);
    }

    // queryClient.setQueryData([GET_DEBTOR_KEY, debtor.id], debtor);

    return debtor;
  }

  @handleError('Error adding debtor')
  async addDebtor(params: AddDebtorParamsType) {
    const { chargeId, debtor } = params;

    const chargeRef = firestore().collection(CHARGES_COLLECTION).doc(chargeId);

    await firestore().runTransaction(async (transaction) => {
      const debtorFirebase: DebtorsFirebaseType = {
        ...debtor,
        payments: [],
      };

      const debtorRef = firestore()
        .collection(DEBTORS_COLLECTION)
        .doc(debtorFirebase.id);

      transaction.set(debtorRef, debtorFirebase);

      const chargeSnap = await transaction.get(chargeRef);

      if (chargeSnap.exists()) {
        const charge = chargeSnap.data() as ChargesFirebaseType;

        charge.debtors.push(debtorRef);

        transaction.update(chargeRef, charge);
      }

      // queryClient.setQueryData([GET_DEBTOR_KEY, debtorFirebase.id], debtorFirebase);
    });

    return true;
  }

  @handleError('Error updating debtor')
  async updateDebtor(params: UpdateDebtorParamsType) {
    // only the shallow fields can be updated, those are:
    // name, description, factor
    const { debtorId, debtor } = params;

    const debtorFirebase: Partial<DebtorsFirebaseType> = {};

    if (debtor.name) debtorFirebase.name = debtor.name;
    if (debtor.description) debtorFirebase.description = debtor.description;
    if (debtor.factor) debtorFirebase.factor = debtor.factor;

    await firestore()
      .collection(DEBTORS_COLLECTION)
      .doc(debtorId)
      .update(debtorFirebase);

    // queryClient.setQueryData([GET_DEBTOR_KEY, debtorId], (oldData: DebtorType) => ({
    //   ...oldData,
    //   ...debtor,
    // }));

    return true;
  }

  @handleError('Error deleting debtor')
  async deleteDebtor(params: DeleteDebtorParamsType) {
    const { chargeId, debtorId } = params;

    const chargeRef = firestore().collection(CHARGES_COLLECTION).doc(chargeId);

    await firestore().runTransaction(async (transaction) => {
      const debtorRef = firestore()
        .collection(DEBTORS_COLLECTION)
        .doc(debtorId);

      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_DEBTOR_NOT_FOUND);
      }

      transaction.update(debtorRef, { deleted: true });

      const chargeSnap = await transaction.get(chargeRef);

      if (chargeSnap.exists()) {
        const charge = chargeSnap.data() as ChargesFirebaseType;

        const debtorIndex = charge.debtors.findIndex(
          (debtor) => debtor.id === debtorId
        );

        if (debtorIndex !== -1) {
          charge.debtors.splice(debtorIndex, 1);

          transaction.update(chargeRef, charge);
        }
      }

      // queryClient.removeQueries({
      //   predicate: (query) => [GET_DEBTOR_KEY, debtorId].includes(query.queryKey[1] as string),
      // });
    });

    return true;
  }

  // Payments
  @handleError('Error adding payment')
  async addPayment(params: AddPaymentParamsType) {
    const { debtorId, payment } = params;

    const debtorRef = firestore().collection(DEBTORS_COLLECTION).doc(debtorId);

    await firestore().runTransaction(async (transaction) => {
      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_DEBTOR_NOT_FOUND);
      }

      const debtor = debtorSnap.data() as DebtorsFirebaseType;

      const paymentId = uuidv4();

      const attachment = await this.parseBase64ToBlob(
        paymentId,
        payment.attachment
      );

      const paymentFirebase: PaymentFirebaseType = {
        ...payment,
        id: paymentId,
        attachment,
      };

      const paymentRef = firestore()
        .collection(PAYMENTS_COLLECTION)
        .doc(paymentFirebase.id);

      transaction.set(paymentRef, paymentFirebase);

      debtor.payments.push(paymentRef);
      transaction.update(debtorRef, debtor);

      // queryClient.setQueryData([GET_PAYMENT_KEY, paymentId], paymentFirebase);

      // queryClient.removeQueries({
      //   predicate: (query) =>
      //     [GET_DEBTOR_KEY, GET_DEBTOR_SCHEDULE_KEY].includes(query.queryKey[1] as string),
      // });
    });

    return true;
  }

  @handleError('Error updating payment')
  async updatePayment(params: UpdatePaymentParamsType) {
    const { paymentId, payment } = params;

    const paymentFirebase: Partial<PaymentFirebaseType> = {};

    if (payment.amount) paymentFirebase.amount = payment.amount;
    if (payment.description) paymentFirebase.description = payment.description;
    if (payment.attachment && !this.isFirebaseStorageUrl(payment.attachment)) {
      paymentFirebase.attachment = await this.parseBase64ToBlob(
        paymentId,
        payment.attachment
      );
    }

    await firestore()
      .collection(PAYMENTS_COLLECTION)
      .doc(paymentId)
      .update(payment);

    // queryClient.setQueryData([GET_PAYMENT_KEY, paymentId], (oldData: PaymentType) => ({
    //   ...oldData,
    //   ...payment,
    // }));

    // queryClient.removeQueries({
    //   predicate: (query) =>
    //     [GET_DEBTOR_KEY, GET_DEBTOR_SCHEDULE_KEY, GET_PAYMENT_KEY].includes(
    //       query.queryKey[1] as string,
    //     ),
    // });

    return true;
  }

  @handleError('Error deleting payment')
  async deletePayment(params: DeletePaymentParamsType) {
    const { debtorId, paymentId } = params;

    const debtorRef = firestore().collection(DEBTORS_COLLECTION).doc(debtorId);

    await firestore().runTransaction(async (transaction) => {
      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_DEBTOR_NOT_FOUND);
      }

      const debtor = debtorSnap.data() as DebtorsFirebaseType;

      const paymentIndex = debtor.payments.findIndex(
        (payment) => payment.id === paymentId
      );

      if (paymentIndex !== -1) {
        debtor.payments.splice(paymentIndex, 1);
        transaction.update(debtorRef, debtor);

        const paymentRef = firestore()
          .collection(PAYMENTS_COLLECTION)
          .doc(paymentId);
        transaction.update(paymentRef, { deleted: true });
      } else {
        Logger.error(
          `Payment with id ${paymentId} not found in debtor with id ${debtorId}`
        );
      }

      // queryClient.removeQueries({
      //   predicate: (query) =>
      //     [GET_DEBTOR_KEY, GET_DEBTOR_SCHEDULE_KEY, GET_PAYMENT_KEY].includes(
      //       query.queryKey[1] as string,
      //     ),
      // });
    });

    return true;
  }

  @handleError('Error getting file from URL')
  async getFileFromURL(params: PaymentFileParamsType) {
    const { paymentId, fileName, mimeType } = params;

    const imageRef = storage().ref(
      `payments/${paymentId}.${mimeType.replace('image/', '')}`
    );

    const urlDownload = await imageRef.getDownloadURL();

    const downloadResumable = FileSystem.createDownloadResumable(
      urlDownload,
      FileSystem.cacheDirectory + fileName
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.status !== 200) {
      throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_FILE);
    }

    const file: PaymentFileType = {
      mimeType: result.mimeType!,
      uri: result.uri,
      fileName,
    };

    return file;
  }
}

export default FirebaseDS;

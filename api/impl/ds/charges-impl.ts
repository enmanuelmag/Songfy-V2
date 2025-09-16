import 'react-native-get-random-values';

import { v4 as uuidv4 } from 'uuid';

import * as FileSystem from 'expo-file-system';



import ChargesDS from '@api/domain/ds/charges-ds';
import UserImpl from '@api/impl/ds/user-impl';
import {
  CHARGES_COLLECTION,
  DEBTORS_COLLECTION,
  PAYMENTS_COLLECTION,
} from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { getStorage, ref } from '@react-native-firebase/storage';
import { Logger } from '@utils/log';

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
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// const CACHE_SIZE_BYTES = 512 * 1024 * 1024;

const firestore = getFirestore();
const storage = getStorage();

class ChargesImpl extends ChargesDS {
  static instance?: ChargesImpl;

  private userService = UserImpl.getInstance();

  constructor() {
    super();
  }

  static getInstance() {
    if (!ChargesImpl.instance) {
      ChargesImpl.instance = new ChargesImpl();
    }

    return ChargesImpl.instance;
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

    // const imageRef = storage().ref(
    //   `payments/${paymentId}.${contentType.replace('image/', '')}`
    // );

    const imageRef = ref(
      storage,
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
      const paymentSnap = await getDoc(paymentRef);

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

  @handleError('Error getting debtor from charge')
  async getDebtorFromCharge(charge: ChargesFirebaseType) {
    const debtors: Array<DebtorType> = [];

    for (const chargeDebtor of charge.debtors) {
      const debtorSnap = await getDoc(chargeDebtor);

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

  @handleError('Error getting charges')
  async getCharges() {
    const user = await this.userService.getUser();

    // const chargesSnap = await firestore()
    //   .collection(CHARGES_COLLECTION)
    //   .where('userId', '==', user.uid)
    //   .where('deleted', '==', false)
    //   .get();

    const chargesSnap = await getDocs(
      query(
        collection(firestore, CHARGES_COLLECTION),
        where('userId', '==', user.uid),
        where('deleted', '==', false)
      )
    );

    const chargesData = chargesSnap.docs.map(
      (d) => d.data() as ChargesFirebaseType
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
    // const chargeSnap = await firestore()
    //   .collection(CHARGES_COLLECTION)
    //   .doc(id)
    //   .get();

    const chargeRef = doc(firestore, CHARGES_COLLECTION, id);

    const chargeSnap = await getDoc(chargeRef);

    if (!chargeSnap.exists()) {
      Logger.error(`Charge with id ${id} not found`);
      throw new Error('Charge not found');
    }

    const chargeData = chargeSnap.data() as ChargesFirebaseType;

    const debtors = await this.getDebtorFromCharge(chargeData);

    const charge: ChargeType = {
      ...chargeData,
      debtors,
    };

    if (charge.deleted) {
      Logger.error(`Charge with id ${id} is deleted`);
      throw new Error('Charge not found');
    }

    return charge;
  }

  @handleError('Error creating charge')
  async createCharge(charge: ChargeType) {
    const user = await this.userService.getUser();

    await runTransaction(firestore, async (transaction) => {
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

        // const debtorRef = firestore()
        //   .collection(DEBTORS_COLLECTION)
        //   .doc(debtorFirebase.id);

        const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorFirebase.id);

        const checkDebtor = await transaction.get(debtorRef);
        if (!checkDebtor.exists()) {
          transaction.set(debtorRef, debtorFirebase);
        }

        transaction.set(debtorRef, debtorFirebase);

        debtorsRef.push(debtorRef);
      }

      // const chargeRef = firestore()
      //   .collection(CHARGES_COLLECTION)
      //   .doc(chargeFirebase.id);

      const chargeRef = doc(firestore, CHARGES_COLLECTION, chargeFirebase.id);

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

    // await firestore()
    //   .collection(CHARGES_COLLECTION)
    //   .doc(id)
    //   .update(chargeFirebase);

    const chargeRef = doc(firestore, CHARGES_COLLECTION, id);

    await updateDoc(chargeRef, chargeFirebase);

    // queryClient.setQueryData([GET_CHARGE_KEY, id], (oldData: ChargeType) => ({
    //   ...oldData,
    //   ...charge,
    // }));

    return true;
  }

  @handleError('Error deleting charge')
  async deleteCharge(id: string) {
    // await firestore()
    //   .collection(CHARGES_COLLECTION)
    //   .doc(id)
    //   .update({ deleted: true });

    const chargeRef = doc(firestore, CHARGES_COLLECTION, id);

    await updateDoc(chargeRef, { deleted: true });

    return true;
  }

  // Debtors
  @handleError('Error getting debtors')
  async getDebtor(id: string): Promise<DebtorType> {
    // const cachedDebtor = queryClient.getQueryData<DebtorType>([GET_DEBTOR_KEY, id]);

    // if (cachedDebtor) {
    //   return cachedDebtor;
    // }

    // const debtorSnap = await firestore()
    //   .collection(DEBTORS_COLLECTION)
    //   .doc(id)
    //   .get();

    const debtorRef = doc(firestore, DEBTORS_COLLECTION, id);

    const debtorSnap = await getDoc(debtorRef);

    if (!debtorSnap.exists()) {
      Logger.error(`Debtor with id ${id} not found`);
      throw new Error('Debtor not found');
    }

    const debtorData = debtorSnap.data() as DebtorsFirebaseType;

    const payments = await this.getPaymentsFromDebtor(debtorData);

    const debtor: DebtorType = {
      ...debtorData,
      payments,
    };

    if (debtor.deleted) {
      Logger.error(`Debtor with id ${id} is deleted`);
      throw new Error('Debtor not found');
    }

    // queryClient.setQueryData([GET_DEBTOR_KEY, debtor.id], debtor);

    return debtor;
  }

  @handleError('Error adding debtor')
  async addDebtor(params: AddDebtorParamsType) {
    const { chargeId, debtor } = params;

    // const chargeRef = firestore().collection(CHARGES_COLLECTION).doc(chargeId);

    const chargeRef = doc(firestore, CHARGES_COLLECTION, chargeId);

    await runTransaction(firestore, async (transaction) => {
      const debtorFirebase: DebtorsFirebaseType = {
        ...debtor,
        payments: [],
      };

      // const debtorRef = firestore()
      //   .collection(DEBTORS_COLLECTION)
      //   .doc(debtorFirebase.id);

      const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorFirebase.id);

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

    // await firestore()
    //   .collection(DEBTORS_COLLECTION)
    //   .doc(debtorId)
    //   .update(debtorFirebase);

    const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorId);

    await updateDoc(debtorRef, debtorFirebase);

    // queryClient.setQueryData([GET_DEBTOR_KEY, debtorId], (oldData: DebtorType) => ({
    //   ...oldData,
    //   ...debtor,
    // }));

    return true;
  }

  @handleError('Error deleting debtor')
  async deleteDebtor(params: DeleteDebtorParamsType) {
    const { chargeId, debtorId } = params;

    // const chargeRef = firestore().collection(CHARGES_COLLECTION).doc(chargeId);

    const chargeRef = doc(firestore, CHARGES_COLLECTION, chargeId);

    await runTransaction(firestore, async (transaction) => {
      // const debtorRef = firestore()
      //   .collection(DEBTORS_COLLECTION)
      //   .doc(debtorId);

      const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorId);

      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw new Error('Debtor not found');
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

    // const debtorRef = firestore().collection(DEBTORS_COLLECTION).doc(debtorId);

    const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorId);

    await runTransaction(firestore, async (transaction) => {
      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw new Error('Debtor not found');
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

      // const paymentRef = firestore()
      //   .collection(PAYMENTS_COLLECTION)
      //   .doc(paymentFirebase.id);

      const paymentRef = doc(
        firestore,
        PAYMENTS_COLLECTION,
        paymentFirebase.id
      );

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

    // await firestore()
    //   .collection(PAYMENTS_COLLECTION)
    //   .doc(paymentId)
    //   .update(payment);

    const paymentRef = doc(firestore, PAYMENTS_COLLECTION, paymentId);

    await updateDoc(paymentRef, paymentFirebase);

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

    // const debtorRef = firestore().collection(DEBTORS_COLLECTION).doc(debtorId);

    const debtorRef = doc(firestore, DEBTORS_COLLECTION, debtorId);

    await runTransaction(firestore, async (transaction) => {
      const debtorSnap = await transaction.get(debtorRef);

      if (!debtorSnap.exists()) {
        Logger.error(`Debtor with id ${debtorId} not found`);
        throw new Error('Debtor not found');
      }

      const debtor = debtorSnap.data() as DebtorsFirebaseType;

      const paymentIndex = debtor.payments.findIndex(
        (payment) => payment.id === paymentId
      );

      if (paymentIndex !== -1) {
        debtor.payments.splice(paymentIndex, 1);
        transaction.update(debtorRef, debtor);

        // const paymentRef = firestore()
        //   .collection(PAYMENTS_COLLECTION)
        //   .doc(paymentId);

        const paymentRef = doc(firestore, PAYMENTS_COLLECTION, paymentId);

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

    const imageRef = ref(
      storage,
      `payments/${paymentId}.${mimeType.replace('image/', '')}`
    );

    const urlDownload = await imageRef.getDownloadURL();

    const downloadResumable = FileSystem.createDownloadResumable(
      urlDownload,
      FileSystem.cacheDirectory + fileName
    );

    const result = await downloadResumable.downloadAsync();

    if (result?.status !== 200) {
      throw new Error('Error downloading file');
    }

    const file: PaymentFileType = {
      mimeType: result.mimeType!,
      uri: result.uri,
      fileName,
    };

    return file;
  }
}

export default ChargesImpl;

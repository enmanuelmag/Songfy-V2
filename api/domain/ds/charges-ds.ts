import type {
  AddDebtorParamsType,
  AddPaymentParamsType,
  ChargeCreateType,
  ChargeType,
  DebtorType,
  DeleteDebtorParamsType,
  DeletePaymentParamsType,
  PaymentFileParamsType,
  PaymentFileType,
  UpdateDebtorParamsType,
  UpdatePaymentParamsType,
} from '@customTypes/charges';

abstract class ChargesDS {
  // Charges
  abstract getCharges(): Promise<Array<ChargeType>>;

  abstract getCharge(id: string): Promise<ChargeType>;

  abstract createCharge(charge: ChargeCreateType): Promise<ChargeType>;

  abstract updateCharge(
    id: string,
    charge: Partial<ChargeType>
  ): Promise<boolean>;

  abstract deleteCharge(id: string): Promise<boolean>;

  // Debtors
  abstract getDebtor(cid: string): Promise<DebtorType>;

  abstract addDebtor(params: AddDebtorParamsType): Promise<boolean>;

  abstract updateDebtor(params: UpdateDebtorParamsType): Promise<boolean>;

  abstract deleteDebtor(params: DeleteDebtorParamsType): Promise<boolean>;

  // Payments
  abstract addPayment(params: AddPaymentParamsType): Promise<boolean>;

  abstract deletePayment(params: DeletePaymentParamsType): Promise<boolean>;

  abstract updatePayment(params: UpdatePaymentParamsType): Promise<boolean>;

  abstract getFileFromURL(
    params: PaymentFileParamsType
  ): Promise<PaymentFileType>;
}

export default ChargesDS;

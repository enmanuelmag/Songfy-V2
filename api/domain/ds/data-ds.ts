import type {
  BudgetBaseCreateType,
  BudgetBaseType,
  BudgetExtendedType,
  BulkToggleCompletedEventParamsType,
  CategoryCreateType,
  CategoryType,
  ToggleCompletedEventParamsType,
} from '@customTypes/budget';
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
import type { UserType } from '@customTypes/user';

abstract class DataDS {
  abstract signinWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserType>;

  abstract signinWithGoogle(): Promise<UserType>;

  abstract signinWithApple(): Promise<UserType | null>;

  abstract signinAnonymously(): Promise<UserType>;

  abstract signUpWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserType>;

  abstract signInWithLocalAuth(): Promise<UserType>;

  abstract checkBiometric(): Promise<boolean>;

  abstract setCheckBiometric(value: boolean): Promise<boolean>;

  abstract getCheckBiometric(): Promise<boolean>;

  abstract getUser(): Promise<UserType | null>;

  abstract logout(): Promise<void>;

  abstract deleteAccount(): Promise<void>;

  // Budgets
  abstract getBudgets(): Promise<Array<BudgetExtendedType>>;

  abstract getBudget(id: string): Promise<BudgetExtendedType>;

  abstract createBudget(budget: BudgetBaseCreateType): Promise<BudgetBaseType>;

  abstract updateBudget(
    id: string,
    budget: Partial<BudgetBaseType>
  ): Promise<BudgetBaseType>;

  abstract toggleEventCompleted(
    params: ToggleCompletedEventParamsType
  ): Promise<boolean>;

  abstract toggleEventBalance(
    params: ToggleCompletedEventParamsType
  ): Promise<boolean>;

  abstract bulkToggleEventBalance(
    params: BulkToggleCompletedEventParamsType
  ): Promise<boolean>;

  abstract deleteBudget(id: string): Promise<boolean>;

  abstract deleteEvent(budgetId: string, eventId: string): Promise<boolean>;

  // Categories
  abstract getCategories(): Promise<Array<CategoryType>>;

  abstract createCategory(category: CategoryCreateType): Promise<CategoryType>;

  abstract updateCategory(
    id: string,
    category: Partial<CategoryType>
  ): Promise<CategoryType>;

  abstract deleteCategory(id: string): Promise<boolean>;

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

export default DataDS;

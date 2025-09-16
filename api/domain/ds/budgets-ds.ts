import type {
  BudgetBaseCreateType,
  BudgetBaseType,
  BudgetExtendedType,
  BulkToggleCompletedEventParamsType,
  ToggleCompletedEventParamsType,
} from '@customTypes/budget';

abstract class BudgetsDS {
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
}

export default BudgetsDS;

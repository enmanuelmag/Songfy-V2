import type AIEventsDS from '@api/domain/ds/ai-events-ds';
import type BudgetsDS from '@api/domain/ds/budgets-ds';
import type CategoriesDS from '@api/domain/ds/categories-ds';
import type ChargesDS from '@api/domain/ds/charges-ds';
import type UserDS from '@api/domain/ds/user-ds';

abstract class DataRepo {
  abstract readonly userService: UserDS;
  abstract readonly budgetsService: BudgetsDS;
  abstract readonly categoriesService: CategoriesDS;
  abstract readonly chargesService: ChargesDS;
  abstract readonly aiEventsService: AIEventsDS;
}

export default DataRepo;

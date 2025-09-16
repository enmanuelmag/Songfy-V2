import AIEventsImpl from '@api/impl/ds/ai-events-impl';
import BudgetsImpl from '@api/impl/ds/budgets-impl';
import CategoriesImpl from '@api/impl/ds/categories-impl';
import ChargesImpl from '@api/impl/ds/charges-impl';
import UserImpl from '@api/impl/ds/user-impl';
import DataRepoImpl from '@api/impl/repo/data-repo-impl';

const userService = UserImpl.getInstance();
const budgetsService = BudgetsImpl.getInstance();
const categoriesService = CategoriesImpl.getInstance();
const chargesService = ChargesImpl.getInstance();
const aiEventsService = new AIEventsImpl();

const DataRepo = new DataRepoImpl({
  userService,
  budgetsService,
  categoriesService,
  chargesService,
  aiEventsService,
});

export default DataRepo;

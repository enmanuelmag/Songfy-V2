import AIEventsImpl from '@api/impl/ds/ai-events-impl';
import BudgetsImpl from '@api/impl/ds/budgets-impl';
import CategoriesImpl from '@api/impl/ds/categories-impl';
import ChargesImpl from '@api/impl/ds/charges-impl';
import OpenAIImpl from '@api/impl/ds/open-ai-impl';
import SpotifyImpl from '@api/impl/ds/spotify-impl';
import UserImpl from '@api/impl/ds/user-impl';
import DataRepoImpl from '@api/impl/repo/data-repo-impl';

const userService = UserImpl.getInstance();
const budgetsService = BudgetsImpl.getInstance();
const categoriesService = CategoriesImpl.getInstance();
const chargesService = ChargesImpl.getInstance();
const aiEventsService = new AIEventsImpl();
const openAIService = OpenAIImpl.getInstance();
const spotifyService = SpotifyImpl.getInstance();

const DataRepo = new DataRepoImpl({
  userService,
  budgetsService,
  categoriesService,
  chargesService,
  aiEventsService,
  openAIService,
  spotifyService,
});

export default DataRepo;

import type AIEventsDS from '@api/domain/ds/ai-events-ds';
import type BudgetsDS from '@api/domain/ds/budgets-ds';
import type CategoriesDS from '@api/domain/ds/categories-ds';
import type ChargesDS from '@api/domain/ds/charges-ds';
import type UserDS from '@api/domain/ds/user-ds';
import OpenAIDS from '../ds/open-ai-ds';
import SpotifyDS from '../ds/spotify-ds';

abstract class DataRepo {
  abstract readonly userService: UserDS;
  abstract readonly budgetsService: BudgetsDS;
  abstract readonly categoriesService: CategoriesDS;
  abstract readonly chargesService: ChargesDS;
  abstract readonly aiEventsService: AIEventsDS;

  abstract spotifyService: SpotifyDS;
  abstract openAIService: OpenAIDS;
}

export default DataRepo;

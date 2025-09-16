import DataRepo from '@api/domain/repo/data-repo';

import type AIEventsDS from '@api/domain/ds/ai-events-ds';
import type BudgetsDS from '@api/domain/ds/budgets-ds';
import type CategoriesDS from '@api/domain/ds/categories-ds';
import type ChargesDS from '@api/domain/ds/charges-ds';
import OpenAIDS from '@api/domain/ds/open-ai-ds';
import SpotifyDS from '@api/domain/ds/spotify-ds';
import type UserDS from '@api/domain/ds/user-ds';

type ConstructorParamsType = {
  userService: UserDS;
  budgetsService: BudgetsDS;
  categoriesService: CategoriesDS;
  chargesService: ChargesDS;
  aiEventsService: AIEventsDS;

  openAIService: OpenAIDS;
  spotifyService: SpotifyDS;
};

class DataRepoImpl extends DataRepo {
  readonly userService: UserDS;
  readonly budgetsService: BudgetsDS;
  readonly categoriesService: CategoriesDS;
  readonly chargesService: ChargesDS;
  readonly aiEventsService: AIEventsDS;

  readonly openAIService: OpenAIDS;
  readonly spotifyService: SpotifyDS;

  constructor(params: ConstructorParamsType) {
    super();
    this.userService = params.userService;
    this.budgetsService = params.budgetsService;
    this.categoriesService = params.categoriesService;
    this.chargesService = params.chargesService;
    this.aiEventsService = params.aiEventsService;

    this.openAIService = params.openAIService;
    this.spotifyService = params.spotifyService;
  }
}

export default DataRepoImpl;

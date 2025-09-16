import type { CategoryCreateType, CategoryType } from '@customTypes/budget';

abstract class CategoriesDS {
  // Categories
  abstract getCategories(): Promise<Array<CategoryType>>;

  abstract getCategoryById(id: string): Promise<CategoryType>;

  abstract createCategory(category: CategoryCreateType): Promise<CategoryType>;

  abstract updateCategory(
    id: string,
    category: Partial<CategoryType>
  ): Promise<CategoryType>;

  abstract deleteCategory(id: string): Promise<boolean>;
}

export default CategoriesDS;

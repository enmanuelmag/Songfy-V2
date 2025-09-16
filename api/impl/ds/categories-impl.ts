import 'react-native-get-random-values';

import { v4 as uuidv4 } from 'uuid';

import CategoriesDS from '@api/domain/ds/categories-ds';
import UserImpl from '@api/impl/ds/user-impl';
import { DefaultCategories } from '@constants/budget';
import { CATEGORIES_COLLECTION, USERS_COLLECTION } from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

import type { CategoryCreateType, CategoryType } from '@customTypes/budget';
import type { UserType } from '@customTypes/user';

const firestore = getFirestore();

// const CACHE_SIZE_BYTES = 512 * 1024 * 1024;

class CategoriesImpl extends CategoriesDS {
  static instance?: CategoriesImpl;

  private userService = UserImpl.getInstance();

  constructor() {
    super();
  }

  static getInstance() {
    if (!CategoriesImpl.instance) {
      CategoriesImpl.instance = new CategoriesImpl();
    }
    return CategoriesImpl.instance;
  }

  // Categories
  @handleError('Error getting categories')
  async getCategories() {
    const user = await this.userService.getUser();

    const categoriesResponse = new Promise<Array<CategoryType>>((resolve) =>
      runTransaction(firestore, async (transaction) => {
        // const userRef = firestore().collection(USERS_COLLECTION).doc(user.uid);
        const userRef = doc(firestore, USERS_COLLECTION, user.uid);

        const userSnap = await transaction.get(userRef);

        let userData = userSnap.data() as UserType | undefined;

        if (!userData || !userData.metadata.alreadyDefaultCategories) {
          const newCategories = DefaultCategories.map((category) => ({
            ...category,
            id: uuidv4(),
            userId: user.uid,
          }));

          for (const category of newCategories) {
            // await firestore()
            //   .collection(CATEGORIES_COLLECTION)
            //   .doc(category.id)
            //   .set(category);

            // await setDoc(
            //   doc(firestore, CATEGORIES_COLLECTION, category.id),
            //   category,
            //   { merge: true }
            // );
            transaction.set(
              doc(firestore, CATEGORIES_COLLECTION, category.id),
              category,
              { merge: true }
            );
          }

          userData = {
            ...user,
            metadata: {
              alreadyDefaultCategories: true,
            },
          };

          if (userSnap.exists()) {
            transaction.update(userRef, userData);
          } else {
            transaction.set(userRef, userData);
          }
        }

        // const categoriesSnap = await firestore()
        //   .collection(CATEGORIES_COLLECTION)
        //   .where('userId', '==', user.uid)
        //   .orderBy('name')
        //   .get();

        const categoriesSnap = await getDocs(
          query(
            collection(firestore, CATEGORIES_COLLECTION),
            where('userId', '==', user.uid),
            orderBy('name')
          )
        );

        const categories = categoriesSnap.docs.map(
          (d) => d.data() as CategoryType
        );

        resolve(categories);
      })
    );

    return categoriesResponse;
  }

  @handleError('Error getting category by id')
  async getCategoryById(id: string) {
    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, id);

    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      throw new Error('Category not found');
    }

    return categorySnap.data() as CategoryType;
  }

  @handleError('Error getting category')
  async createCategory(category: CategoryCreateType) {
    const user = await this.userService.getUser();

    const categoryBase: CategoryType = {
      ...category,
      id: uuidv4(),
      userId: user.uid,
    };

    // await firestore()
    //   .collection(CATEGORIES_COLLECTION)
    //   .doc(categoryBase.id)
    //   .set(categoryBase);

    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, categoryBase.id);

    await setDoc(categoryRef, categoryBase, { merge: true });

    return categoryBase;
  }

  @handleError('Error updating category')
  async updateCategory(id: string, category: CategoryType) {
    // await firestore()
    //   .collection(CATEGORIES_COLLECTION)
    //   .doc(id)
    //   .update(category);

    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, id);

    await updateDoc(categoryRef, category);

    return category;
  }

  @handleError('Error deleting category')
  async deleteCategory(id: string) {
    // await firestore().collection(CATEGORIES_COLLECTION).doc(id).delete();

    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, id);

    await deleteDoc(categoryRef);

    return true;
  }
}

export default CategoriesImpl;

import 'react-native-get-random-values';

import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import BudgetsDS from '@api/domain/ds/budgets-ds';
import UserImpl from '@api/impl/ds/user-impl';
import {
  BUDGETS_COLLECTION,
  CATEGORIES_COLLECTION,
} from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { isArchivedEvent } from '@utils/budget';
import { parseEntityToRef, parseRefToEntity } from '@utils/firebase';
import { Logger } from '@utils/log';
import { cancelNotification, scheduleNotification } from '@utils/notifications';
import { isAndroid, isIOS } from '@utils/platform';



import type {
  BudgetBaseCreateType,
  BudgetBaseType,
  BudgetExtendedType,
  BudgetFirebaseType,
  BulkToggleCompletedEventParamsType,
  CategoryType,
  EventBaseType,
  EventFirebaseType,
  ToggleCompletedEventParamsType,
} from '@customTypes/budget';
import type * as Notifications from 'expo-notifications';

// const CACHE_SIZE_BYTES = 512 * 1024 * 1024;

const firestore = getFirestore();

class BudgetsImpl extends BudgetsDS {
  static instance?: BudgetsImpl;

  private userService = UserImpl.getInstance();

  constructor() {
    super();
  }

  static getInstance() {
    if (!BudgetsImpl.instance) {
      BudgetsImpl.instance = new BudgetsImpl();
    }

    return BudgetsImpl.instance;
  }

  // Budgets
  segregateEvents(parsedEvents: Array<EventBaseType>) {
    const events: Array<EventBaseType> = [];
    const eventsArchived: Array<EventBaseType> = [];

    for (const event of parsedEvents) {
      const isArchived = isArchivedEvent(event);

      if (isArchived) {
        eventsArchived.push(event);
      } else {
        events.push(event);
      }
    }

    events.sort((a, b) => b.date - a.date);

    eventsArchived.sort((a, b) => b.date - a.date);

    return { events, eventsArchived };
  }

  @handleError('Error getting budgets')
  async getBudgets() {
    const user = await this.userService.getUser();

    // const budgetsSnap = await firestore()
    //   .collection(BUDGETS_COLLECTION)
    //   .where('userId', '==', user.uid)
    //   .where('deleted', '==', false)
    //   .get();

    const budgetsSnap = await getDocs(
      query(
        collection(firestore, BUDGETS_COLLECTION),
        where('userId', '==', user.uid),
        where('deleted', '==', false)
      )
    );

    const parsedBudgets: Array<BudgetExtendedType> = [];

    const budgetsData = budgetsSnap.docs.map(
      (d: { data: () => BudgetFirebaseType }) => d.data()
    );

    for (const budget of budgetsData) {
      // const budgetCache = queryClient.getQueryData<BudgetExtendedType>([
      //   GET_BUDGET_KEY,
      //   budgetsData[idx].id,
      // ]);

      // if (budgetCache) {
      //   parsedBudgets.push(budgetCache);
      //   continue;
      // }

      const parsedEvents: Array<EventBaseType> = [];

      for (const event of budget.events) {
        parsedEvents.push({
          ...event,
          category: await parseRefToEntity<CategoryType>(event.category),
        });
      }

      const { events, eventsArchived } = this.segregateEvents(parsedEvents);

      const budgetExtended: BudgetExtendedType = {
        ...budget,
        events,
        eventsArchived,
      };

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetExtended.id], budgetExtended);

      parsedBudgets.push(budgetExtended);
    }

    return parsedBudgets;
  }

  @handleError('Error getting budget')
  async getBudget(id: string) {
    // const cachedBudget = queryClient.getQueryData<BudgetExtendedType>([GET_BUDGET_KEY, id]);

    // if (cachedBudget) {
    //   return cachedBudget;
    // }

    // const budgetSnap = await firestore()
    //   .collection(BUDGETS_COLLECTION)
    //   .doc(id)
    //   .get();

    const budgetRef = doc(firestore, BUDGETS_COLLECTION, id);

    const budgetSnap = await getDoc(budgetRef);

    if (!budgetSnap.exists()) {
      Logger.error(`Budget with id ${id} not found`);
      throw new Error(`Budget with id ${id} not found`);
    }

    const budgetData = budgetSnap.data() as BudgetFirebaseType;

    const parsedEvents: Array<EventBaseType> = [];

    for (const event of budgetData.events) {
      parsedEvents.push({
        ...event,
        category: await parseRefToEntity<CategoryType>(event.category),
      });
    }

    const { events, eventsArchived } = this.segregateEvents(parsedEvents);

    const budget: BudgetExtendedType = {
      ...budgetData,
      events,
      eventsArchived,
    };

    if (budget.deleted) {
      Logger.error(`Budget with id ${id} is deleted`);
      throw new Error(`Budget with id ${id} is deleted`);
    }

    return budget;
  }

  buildTriggerByPlatform(event: EventBaseType) {
    const { repeat, timeNotification, date } = event;
    const { hour, minute } = timeNotification;

    const dateMoment = moment.unix(date);

    if (isIOS) {
      const trigger = {
        hour,
        minute,
      } as Record<string, unknown>;

      if (repeat.isAlways) {
        trigger.repeats = true;
      }
      if (repeat.type === 'week') {
        trigger.weekday = dateMoment.day();
      } else if (repeat.type === 'month') {
        trigger.day = dateMoment.date();
      } else if (repeat.type === 'year') {
        trigger.month = dateMoment.month();
        trigger.day = dateMoment.date();
      } else if (repeat.type === 'unique') {
        trigger.year = dateMoment.year();
        trigger.month = dateMoment.month();
        trigger.day = dateMoment.date();
      }
      // else {
      //   return moment.unix(date).set({ hour, minute }).toDate();
      // }

      return trigger;
    } else if (isAndroid) {
      if (repeat.isAlways) {
        if (repeat.type === 'day') {
          return {
            repeats: true,
            hour,
            minute,
          };
        } else if (repeat.type === 'week') {
          return {
            repeats: true,
            hour,
            minute,
            weekday: dateMoment.day(),
          };
        } else if (repeat.type === 'month') {
          return {
            repeats: true,
            seconds: moment
              .unix(date)
              .set({ hour, minute })
              .diff(moment(), 'seconds'),
          };
        } else if (repeat.type === 'year') {
          return {
            repeats: true,
            day: dateMoment.date(),
            month: dateMoment.month(),
            hour,
            minute,
          };
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (repeat.type === 'unique') {
          return {
            repeats: false,
            seconds: moment
              .unix(date)
              .set({ hour, minute })
              .diff(moment(), 'seconds'),
          };
        }
      } else {
        return {
          repeats: false,
          seconds: moment
            .unix(date)
            .set({ hour, minute })
            .diff(moment(), 'seconds'),
        };
      }
    }
  }

  async scheduleEventNotification(event: EventBaseType) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!event.timeNotification?.enabled) return;

    const { id } = event;

    const trigger = this.buildTriggerByPlatform(
      event
    ) as Notifications.NotificationTriggerInput;

    await scheduleNotification({
      id: `${event.name}-${id}`,
      title: event.name,
      body: 'Your event is happening today!',
      data: {
        entity: 'event',
        data: event,
      },
      trigger,
    });
  }

  @handleError('Error creating budget')
  async createBudget(budget: BudgetBaseCreateType) {
    const user = await this.userService.getUser();

    const budgetBase: BudgetBaseType = {
      ...budget,
      id: uuidv4(),
      deleted: false,
      userId: user.uid,
    };

    const eventFirebase: Array<EventFirebaseType> = [];

    for (const event of budgetBase.events) {
      eventFirebase.push({
        ...event,
        category: event.category
          ? parseEntityToRef(CATEGORIES_COLLECTION, event.category)
          : null,
      });
    }

    const budgetFirebase: BudgetFirebaseType = {
      ...budgetBase,
      events: eventFirebase,
    };

    // await firestore()
    //   .collection(BUDGETS_COLLECTION)
    //   .doc(budgetBase.id)
    //   .set(budgetFirebase);

    const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetBase.id);

    await setDoc(budgetRef, budgetFirebase);

    for (const event of budgetBase.events) {
      await this.scheduleEventNotification(event);
    }

    return budgetBase;
  }

  @handleError('Error updating budget')
  async updateBudget(id: string, budgetBase: BudgetBaseType) {
    const eventFirebase: Array<EventFirebaseType> = [];

    for (const event of budgetBase.events) {
      eventFirebase.push({
        ...event,
        category: event.category
          ? parseEntityToRef(CATEGORIES_COLLECTION, event.category)
          : null,
      });
    }

    const budgetFirebase: BudgetFirebaseType = {
      ...budgetBase,
      events: eventFirebase,
    };

    // schedule notifications
    for (const event of budgetBase.events) {
      await this.scheduleEventNotification(event);
    }

    // await firestore()
    //   .collection(BUDGETS_COLLECTION)
    //   .doc(id)
    //   .update(budgetFirebase);

    const budgetRef = doc(firestore, BUDGETS_COLLECTION, id);

    await updateDoc(budgetRef, budgetFirebase);

    // queryClient.setQueryData([GET_BUDGET_KEY, id], budgetBase);

    return budgetBase;
  }

  @handleError('Error toggling budget completed')
  async toggleEventCompleted(params: ToggleCompletedEventParamsType) {
    const { budgetId, eventId, currentCompleted, targetDate } = params;
    // get a ref of the budget
    // const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(budgetId);
    const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetId);
    await runTransaction(firestore, async (transaction) => {
      // get the budget data
      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      const currentCompletedDates =
        budget.events[eventIndex].completedDates ?? [];

      let completedDates: Array<number> = [];

      const targetDateMoment = moment.unix(targetDate).startOf('day');

      const event = budget.events[eventIndex];

      if (currentCompleted) {
        // currently completed, so remove the date
        // remove the date from the completed dates
        completedDates = currentCompletedDates.filter(
          (date) => date !== targetDateMoment.unix()
        );

        if (event.type === 'expense') {
          budget.initialBalance += event.amount;
        } else {
          budget.initialBalance -= event.amount;
        }
      } else {
        // currently not completed, so add the date
        // add the date to the completed dates
        completedDates = [...currentCompletedDates, targetDateMoment.unix()];

        if (event.type === 'expense') {
          budget.initialBalance -= event.amount;
        } else {
          budget.initialBalance += event.amount;
        }
      }

      // update the event
      budget.events[eventIndex] = {
        ...budget.events[eventIndex],
        completedDates,
      };

      // update the budget
      transaction.update(budgetRef, budget);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }

  @handleError('Error toggling event balance')
  async toggleEventBalance(params: ToggleCompletedEventParamsType) {
    const { budgetId, eventId, targetDate } = params;
    // get a ref of the budget
    // const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(budgetId);

    const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetId);
    await runTransaction(firestore, async (transaction) => {
      // get the budget data
      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      const event = budget.events[eventIndex];

      const targetDateMoment = moment.unix(targetDate).startOf('day');

      const currentCompletedDates =
        budget.events[eventIndex].completedDates ?? [];

      let completedDates: Array<number> = [];

      if (currentCompletedDates.includes(targetDateMoment.unix())) {
        // currently completed, so remove the date
        // remove the date from the completed dates
        completedDates = currentCompletedDates.filter(
          (date) => date !== targetDateMoment.unix()
        );

        if (event.type === 'expense') {
          budget.initialBalance += event.amount;
        } else {
          budget.initialBalance -= event.amount;
        }
      } else {
        // currently not completed, so add the date
        // add the date to the completed dates
        completedDates = [...currentCompletedDates, targetDateMoment.unix()];

        if (event.type === 'expense') {
          budget.initialBalance -= event.amount;
        } else {
          budget.initialBalance += event.amount;
        }
      }

      // update the event
      budget.events[eventIndex] = {
        ...budget.events[eventIndex],
        completedDates,
      };

      // update the budget
      transaction.update(budgetRef, budget);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }

  @handleError('Error bulk toggling event balance')
  async bulkToggleEventBalance(params: BulkToggleCompletedEventParamsType) {
    const { budgetId, events } = params;

    await runTransaction(firestore, async (transaction) => {
      // const budgetRef = firestore()
      //   .collection(BUDGETS_COLLECTION)
      //   .doc(budgetId);

      const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetId);

      // const budget = budgetSnap.data() as BudgetFirebaseType;

      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      for (const e of events) {
        const eventIndex = budget.events.findIndex(
          ({ id }) => e.eventId === id
        );

        const event = budget.events[eventIndex];

        let completedDates: Array<number> = [];

        const currentCompletedDates =
          budget.events[eventIndex].completedDates ?? [];

        if (e.toggleType === 'balance') {
          // repliace the logic of toggleEventBalance function here
          const targetDateMoment = moment.unix(e.targetDate).startOf('day');

          if (currentCompletedDates.includes(targetDateMoment.unix())) {
            // currently completed, so remove the date
            // remove the date from the completed dates
            completedDates = currentCompletedDates.filter(
              (date) => date !== targetDateMoment.unix()
            );

            if (event.type === 'expense') {
              budget.initialBalance += event.amount;
            } else {
              budget.initialBalance -= event.amount;
            }
          } else {
            // currently not completed, so add the date
            // add the date to the completed dates
            completedDates = [
              ...currentCompletedDates,
              targetDateMoment.unix(),
            ];

            if (event.type === 'expense') {
              budget.initialBalance -= event.amount;
            } else {
              budget.initialBalance += event.amount;
            }
          }
        } else {
          const targetDateMoment = moment.unix(e.targetDate).startOf('day');

          if (e.currentCompleted) {
            // currently completed, so remove the date
            // remove the date from the completed dates
            completedDates = currentCompletedDates.filter(
              (date) => date !== targetDateMoment.unix()
            );

            if (event.type === 'expense') {
              budget.initialBalance += event.amount;
            } else {
              budget.initialBalance -= event.amount;
            }
          } else {
            // currently not completed, so add the date
            // add the date to the completed dates
            completedDates = [
              ...currentCompletedDates,
              targetDateMoment.unix(),
            ];

            if (event.type === 'expense') {
              budget.initialBalance -= event.amount;
            } else {
              budget.initialBalance += event.amount;
            }
          }
        }

        budget.events[eventIndex] = {
          ...budget.events[eventIndex],
          completedDates,
        };

        transaction.update(budgetRef, budget);
      }
    });

    return true;
  }

  @handleError('Error deleting budget')
  async deleteBudget(id: string) {
    await runTransaction(firestore, async (transaction) => {
      // const budgetRef = firestore().collection(BUDGETS_COLLECTION).doc(id);
      const budgetRef = doc(firestore, BUDGETS_COLLECTION, id);

      const budgetSnap = await transaction.get(budgetRef);

      const budget = budgetSnap.data() as BudgetFirebaseType;

      budget.deleted = true;

      transaction.update(budgetRef, budget);

      // cancel all notifications
      for (const eventEvent of budget.events) {
        await cancelNotification(eventEvent.id);
      }

      // queryClient.removeQueries({
      //   predicate: (query) => [GET_BUDGET_KEY, id].includes(query.queryKey[1] as string),
      // });
    });

    return true;
  }

  @handleError('Error creating event')
  async deleteEvent(budgetId: string, eventId: string) {
    const user = await this.userService.getUser();

    await runTransaction(firestore, async (transaction) => {
      // const budgetRef = firestore()
      //   .collection(BUDGETS_COLLECTION)
      //   .doc(budgetId);

      const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetId);

      const budgetSnap = await transaction.get(budgetRef);

      if (!budgetSnap.exists()) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const budget = budgetSnap.data() as BudgetFirebaseType;

      if (budget.userId !== user.uid) {
        Logger.error(`Budget with id ${budgetId} not found`);
        throw new Error(`Budget with id ${budgetId} not found`);
      }

      const eventIndex = budget.events.findIndex(
        (event) => event.id === eventId
      );

      if (eventIndex !== -1) {
        budget.events.splice(eventIndex, 1);
      }

      transaction.update(budgetRef, budget);

      await cancelNotification(eventId);

      // queryClient.setQueryData([GET_BUDGET_KEY, budgetId], budget);
    });

    return true;
  }
}

export default BudgetsImpl;

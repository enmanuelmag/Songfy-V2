import moment from 'moment';

import { ColorLinesPlot, MaxMonthsLinePlot } from '@constants/budget';
import { isArchivedEvent } from '@utils/budget';


import type {
  BudgetBaseType,
  BudgetLinePlotType,
  BuildBudgetBuilderType,
  CategoryAmountType,
  EventBaseType,
  EventBudgetType,
  MonthlyBalanceType,
} from '@customTypes/budget';
import type { DurationInputArg2, Moment } from 'moment';

class BudgetScheduler {
  endDate: Moment;
  startDate: Moment;
  initialBalance: number;
  events: Array<EventBaseType>;

  constructor(params: BudgetBaseType) {
    this.events = params.events;
    // this.startDate = params.startDate ? moment.unix(params.startDate) : moment();
    this.startDate = this.getStartDate(params.startDate);
    this.endDate = moment
      .unix(params.startDate)
      .add(params.endMonths, 'months')
      .endOf('month')
      .endOf('day');
    this.initialBalance = params.initialBalance;
  }

  build(): BuildBudgetBuilderType {
    const { events, endDate, startDate } = this;
    const tempSchedule = this.buildSchedule(events, startDate, endDate);

    const { monthsScheduleLinePlot, monthsSchedule } =
      this.calculateLinePlot(tempSchedule);

    const categoriesAmountGroup = this.buildCategoryOverview(events);

    return {
      monthsSchedule,
      monthsScheduleLinePlot,
      categoriesAmountGroup,
    };
  }

  buildSchedule(
    events: Array<EventBaseType>,
    startDate: Moment,
    endDate: Moment
  ) {
    const monthsSchedule: Array<MonthlyBalanceType> = [];

    const startMonth = startDate.clone().startOf('month');
    const endMonth = endDate.clone().endOf('month');
    const months = endMonth.diff(startMonth, 'months');

    for (let i = 0; i <= months; i++) {
      const date = startMonth.clone().add(i, 'months');
      monthsSchedule.push({
        date: date.unix(),
        month: date.month(),
        year: date.year(),
        incomesEvents: [],
        expensesEvents: [],
        budget: {
          incomes: 0,
          relIncomes: 0,
          expenses: 0,
          relExpenses: 0,
          available: 0,
          relAvailable: 0,
          flowBalance: [],
          monthlyBalance: 0,
          relMonthlyBalance: 0,
          globalBalance: 0,
          relGlobalBalance: 0,
        },
      });
    }

    for (const event of events) {
      this.buildMonthSchedule(monthsSchedule, event);
    }

    return monthsSchedule;
  }

  getFractionalDiff(date1: Moment, date2: Moment, type: DurationInputArg2) {
    const days = date2.diff(date1, 'day');

    let value = 0;
    if (type === 'day') {
      value = days;
    } else if (type === 'week') {
      value = days / 7;
    } else if (type === 'month') {
      value = days / 30;
    } else if (type === 'year') {
      value = days / 365;
    }

    return value < 1 ? 1 : Math.ceil(Math.abs(value));
  }

  buildMonthSchedule(
    monthsSchedule: Array<MonthlyBalanceType>,
    event: EventBaseType
  ) {
    const { date, repeat } = event;

    const eventDate = moment.unix(date);
    const eventYear = eventDate.year();
    const eventMonth = eventDate.month();

    if (repeat.type !== 'unique') {
      const { isAlways, times, type } = repeat;

      let idxDate = eventDate.clone().startOf('day');

      const endDate = (
        isAlways
          ? this.endDate.clone()
          : eventDate
              .clone()
              .add(times - 1, type as DurationInputArg2)
              .endOf('month')
      ).endOf('day');

      const monthStartDate = moment
        .unix(monthsSchedule[0].date)
        .startOf('day')
        .startOf('month');

      const monthStartEvent = eventDate.clone().startOf('day').startOf('month');

      let currentTimes = monthStartEvent.isSameOrBefore(monthStartDate)
        ? monthStartDate.diff(monthStartEvent, type as DurationInputArg2) + 1
        : 1;

      while (idxDate.isSameOrBefore(endDate)) {
        const monthSchedule = monthsSchedule.find(
          ({ month, year }) =>
            month === idxDate.month() && year === idxDate.year()
        );

        if (monthSchedule) {
          const newEvent: EventBudgetType = {
            ...event,
            balance: 0,
            date: idxDate.clone().unix(),
            originalDate: eventDate.clone().unix(),
            repeat: {
              ...repeat,
              currentTimes: currentTimes++,
            },
          };

          if (event.type === 'income') {
            monthSchedule.incomesEvents.push(newEvent);
          } else {
            monthSchedule.expensesEvents.push(newEvent);
          }
        }

        idxDate = idxDate.add(1, type as DurationInputArg2);
      }
    } else {
      const monthSchedule = monthsSchedule.find(
        ({ month, year }) => month === eventMonth && year === eventYear
      );

      if (!monthSchedule) {
        // || !this.validateCompletedDate(event, eventDate)
        return;
      }

      const newEvent: EventBudgetType = {
        ...event,
        balance: 0,
        date: eventDate.clone().unix(),
        originalDate: eventDate.clone().unix(),
        repeat: {
          ...repeat,
          currentTimes: 0,
        },
      };

      if (event.type === 'income') {
        monthSchedule.incomesEvents.push(newEvent);
      } else {
        monthSchedule.expensesEvents.push(newEvent);
      }
    }
  }

  calculateAmount(event: EventBaseType) {
    if (event.repeat.type === 'unique') {
      return {
        monthly: event.amount,
        yearly: event.amount,
      };
    }

    // check how to deal with evnet that just happens 2, 3 or N times
    const { type, isAlways, times } = event.repeat;

    let yearly = 0;

    if (isAlways) {
      if (type === 'day') {
        yearly = event.amount * 365;
      } else if (type === 'week') {
        yearly = event.amount * 52;
      } else if (type === 'month') {
        yearly = event.amount * 12;
      } else {
        yearly = event.amount;
      }
    } else {
      if (type === 'year') {
        yearly = event.amount;
      } else {
        yearly = event.amount * times;
      }
    }

    let monthly = 0;

    if (isAlways) {
      if (type !== 'year') {
        monthly = yearly / 12;
      }
      // for yearly event we dont need to calculate monthly
    } else {
      if (type === 'day') {
        monthly = event.amount * Math.min(30, times);
      } else if (type === 'week') {
        monthly = event.amount * Math.min(4, times);
      } else if (type === 'month') {
        monthly = event.amount;
      }
    }

    return {
      monthly,
      yearly,
    };
  }

  buildCategoryOverview(events: Array<EventBaseType>) {
    const groupedCategories: Record<string, CategoryAmountType> = {};

    let maxValue = -Infinity;

    const notArchivedEvents = events.filter((event) => !isArchivedEvent(event));

    for (const event of notArchivedEvents) {
      const { category, amount, date, repeat } = event;

      const monthStartEvent = moment
        .unix(date)
        .clone()
        .startOf('day')
        .startOf('month');

      const currentDate = moment();

      const currentTimes = monthStartEvent.isSameOrBefore(currentDate)
        ? currentDate.diff(monthStartEvent, repeat.type as DurationInputArg2) +
          1
        : null;

      if (!category) continue;

      if (amount > maxValue) {
        maxValue = amount;
      }

      const categoryAmount = groupedCategories[category.id] as
        | CategoryAmountType
        | undefined;

      const { monthly, yearly } = this.calculateAmount(event);

      const newEvent = {
        ...event,
        repeat: {
          ...repeat,
          currentTimes,
        },
      };

      if (categoryAmount) {
        categoryAmount.amount += amount;

        categoryAmount.amountYearly += yearly;
        categoryAmount.amountMonthly += monthly;

        categoryAmount.events.push(newEvent);
      } else {
        groupedCategories[category.id] = {
          ...category,
          amount,
          amountYearly: yearly,
          amountMonthly: monthly,
          events: [newEvent],
          maxAmount: category.maxAmount || 0,
        };
      }
    }

    const grouped = Object.values(groupedCategories).sort(
      (a, b) => b.amountYearly - a.amountYearly
    );

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let idx = 0; idx < grouped.length; idx++) {
      // const { amount = 0 } = grouped[idx];
      // grouped[idx].percentage = maxValue > 0 ? (amount / maxValue) * 100 : 100;
      grouped[idx].events = grouped[idx].events.sort(
        (a, b) => b.amount - a.amount
      );

      if (grouped[idx].amountMonthly === 0) {
        grouped[idx].amountMonthly = grouped[idx].amountYearly / 12;
      }
    }

    return grouped;
  }

  calculateLinePlot(monthsSchedule: Array<MonthlyBalanceType>) {
    const monthsScheduleLinePlot: BudgetLinePlotType = {
      labels: monthsSchedule
        .map(({ month, year }) =>
          moment().set('month', month).set('year', year).format('MMM')
        )
        .slice(0, MaxMonthsLinePlot),
      legend: ['Incomes', 'Expenses', 'Balance'],
      datasets: [
        {
          data: [],
          color: ColorLinesPlot.incomes,
        },
        {
          data: [],
          color: ColorLinesPlot.expenses,
        },
        {
          data: [],
          color: ColorLinesPlot.balance,
        },
      ],
    };

    let balanceSnap = this.initialBalance || 0;

    // monthsSchedule = monthsSchedule.filter(
    //   (monthData) => monthData.incomesEvents.length || monthData.expensesEvents.length,
    // );

    const currentMonth = moment();

    monthsSchedule.forEach((monthSchedule, idx) => {
      const { incomesEvents, expensesEvents, budget, month, year } =
        monthSchedule;
      const flowBalance: Array<EventBudgetType> = [];

      const targetDate = moment().set('year', year).set('month', month);

      const isFutureMoth =
        targetDate.month() +
          targetDate.year() * 100 -
          (currentMonth.month() + currentMonth.year() * 100) >=
        0;

      const firstFutureMonth =
        targetDate.format('YYYY-MM') === currentMonth.format('YYYY-MM');

      if (isFutureMoth && firstFutureMonth) {
        // budget.incomes = this.initialBalance || 0;
        targetDate.set('date', moment().date());
      } else {
        budget.incomes = 0;
        targetDate.endOf('month').endOf('day');
      }

      incomesEvents.sort((a, b) => a.date - b.date);
      expensesEvents.sort((a, b) => a.date - b.date);

      let idxIncomes = 0;
      let idxExpenses = 0;

      while (
        idxIncomes < incomesEvents.length ||
        idxExpenses < expensesEvents.length
      ) {
        const income = incomesEvents.at(idxIncomes);
        const expense = expensesEvents.at(idxExpenses);

        if (income && expense) {
          const incomeDate = moment.unix(income.date);
          const expenseDate = moment.unix(expense.date);

          const validDateIncome = this.validateDate(income, targetDate);

          const validDateExpense = this.validateDate(expense, targetDate);

          if (!validDateIncome && !validDateExpense) {
            if (incomeDate.isBefore(expenseDate)) {
              flowBalance.push({ ...income, completed: true });
              idxIncomes++;
            } else {
              flowBalance.push({ ...expense, completed: true });
              idxExpenses++;
            }
            continue;
          } else if (!validDateIncome && validDateExpense) {
            idxIncomes++;
            flowBalance.push({ ...income, completed: true });
            continue;
          } else if (validDateIncome && !validDateExpense) {
            flowBalance.push({ ...expense, completed: true });
            idxExpenses++;
            continue;
          }

          if (moment(income.date).isBefore(expense.date)) {
            income.balance = balanceSnap + income.amount;
            balanceSnap += income.amount;
            flowBalance.push({ ...income });
            idxIncomes++;
          } else {
            expense.balance = balanceSnap - expense.amount;
            balanceSnap -= expense.amount;
            flowBalance.push({ ...expense });
            idxExpenses++;
          }
        } else if (income) {
          if (!this.validateDate(income, targetDate)) {
            idxIncomes++;
            flowBalance.push({ ...income, completed: true });
            continue;
          }
          income.balance = balanceSnap + income.amount;
          balanceSnap += income.amount;
          flowBalance.push({ ...income });
          idxIncomes++;
        } else if (expense) {
          if (!this.validateDate(expense, targetDate)) {
            idxExpenses++;
            flowBalance.push({ ...expense, completed: true });
            continue;
          }
          expense.balance = balanceSnap - expense.amount;
          balanceSnap -= expense.amount;
          flowBalance.push({ ...expense });
          idxExpenses++;
        }
      }

      monthSchedule.budget.flowBalance = flowBalance;

      let monthTotalIncomes = 0;
      let monthPendingIncomes = 0;

      incomesEvents.forEach((event) => {
        // if (isFutureMoth && !this.validateDate(event, targetDate)) return;
        // budget.incomes += event.amount;
        monthTotalIncomes += event.amount;
        if (isFutureMoth && this.validateDate(event, targetDate)) {
          monthPendingIncomes += event.amount;
        }
      });

      let monthTotalExpenses = 0;
      let monthPendingExpenses = 0;

      expensesEvents.forEach((event) => {
        // if (isFutureMoth && !this.validateDate(event, targetDate)) return;
        // budget.expenses += event.amount;
        monthTotalExpenses += event.amount;
        if (isFutureMoth && this.validateDate(event, targetDate)) {
          monthPendingExpenses += event.amount;
        }
      });

      budget.incomes += monthTotalIncomes;
      budget.expenses += monthTotalExpenses;

      // budget.available = budget.incomes;
      budget.available = monthTotalIncomes;
      if (idx > 0 && isFutureMoth) {
        budget.available += monthsSchedule[idx - 1].budget.globalBalance;
      }

      // budget.monthlyBalance += budget.incomes - budget.expenses;
      if (isFutureMoth) {
        budget.monthlyBalance =
          monthPendingIncomes +
          (firstFutureMonth ? this.initialBalance : 0) -
          monthPendingExpenses;
      } else {
        budget.monthlyBalance += budget.incomes - budget.expenses;
      }

      budget.globalBalance += budget.monthlyBalance;

      const isFutureNext = targetDate
        .startOf('month')
        .startOf('day')
        .isAfter(currentMonth.startOf('month').startOf('day'));

      if (idx > 0 && isFutureNext && isFutureMoth) {
        budget.globalBalance += monthsSchedule[idx - 1].budget.globalBalance;
      }

      if (idx > 0) {
        const prevBudget = monthsSchedule[idx - 1].budget;

        const incomesTemp = idx === 1 ? prevBudget.incomes : prevBudget.incomes;

        budget.relIncomes = this.getRelativePercentage(
          budget.incomes,
          incomesTemp
        );
        budget.relExpenses = this.getRelativePercentage(
          budget.expenses,
          prevBudget.expenses
        );
        budget.relAvailable = this.getRelativePercentage(
          budget.available,
          prevBudget.available
        );
        budget.relMonthlyBalance = this.getRelativePercentage(
          budget.monthlyBalance,
          prevBudget.monthlyBalance
        );
        budget.relGlobalBalance = this.getRelativePercentage(
          budget.globalBalance,
          prevBudget.globalBalance
        );
      }

      monthSchedule.budget = budget;

      if (monthsScheduleLinePlot.datasets[0].data.length < MaxMonthsLinePlot) {
        monthsScheduleLinePlot.datasets[0].data.push(
          budget.incomes // - (idx === 0 ? this.initialBalance : 0),
        );

        monthsScheduleLinePlot.datasets[1].data.push(budget.expenses);

        monthsScheduleLinePlot.datasets[2].data.push(budget.globalBalance);
      }
    });

    // monthsSchedule[0].budget.incomes -= this.initialBalance || 0;

    return { monthsScheduleLinePlot, monthsSchedule };
  }

  getRelativePercentage(currentValue: number, previousValue: number) {
    return Number(((currentValue / previousValue - 1) * 100).toFixed(2));
  }

  validateCompletedDate(event: EventBaseType, targetDate: Moment) {
    if (!event.completedDates || !event.completedDates.length) {
      return true;
    }

    return !event.completedDates.some(
      (completeDateUnix) =>
        completeDateUnix === targetDate.startOf('day').unix()
    );
  }

  validateDate(event: EventBaseType, monthDate: Moment) {
    const currentMonth = moment().startOf('day');

    const eventMoment = moment.unix(event.date);
    const validDate = eventMoment.diff(this.startDate, 'days') >= 0;
    const notCompleted = this.validateCompletedDate(
      event,
      eventMoment.startOf('day')
    );

    let notPassedDate = true;
    if (
      currentMonth.isSame(monthDate, 'month') &&
      currentMonth.isSame(monthDate, 'year')
    ) {
      notPassedDate = currentMonth.isBefore(eventMoment.startOf('day'));
    } else {
      notPassedDate = currentMonth.isBefore(eventMoment.startOf('day'));
    }

    return validDate && notCompleted && notPassedDate;
  }

  getStartDate(budgetStart: number) {
    // , events: EventBaseType[]
    const budgetStartDate = moment.unix(budgetStart).startOf('day');

    return budgetStartDate;

    // let eventsStartDate = moment().startOf('day');

    // for (const event of events) {
    //   const eventDate = moment.unix(event.date).startOf('day');

    //   if (eventDate.isBefore(eventsStartDate)) {
    //     eventsStartDate = eventDate;
    //   }
    // }

    // return eventsStartDate.isBefore(budgetStartDate) ? eventsStartDate : budgetStartDate;
  }
}

export default BudgetScheduler;

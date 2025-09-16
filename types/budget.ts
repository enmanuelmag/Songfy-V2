import z from 'zod';

import { MAX_NUMBER_VALUE, MAX_TIME_REPEAT } from '@constants/app';

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type DocumentRef = FirebaseFirestoreTypes.DocumentReference;

export const EmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});
export type EmailType = z.infer<typeof EmailSchema>;

// Budget Modes
export const BudgetModesSchema = z.enum(['create', 'edit', 'view']);

export type BudgetModesType = z.infer<typeof BudgetModesSchema>;

export const RepeatSchema = z.enum(['unique', 'day', 'week', 'month', 'year']);

export type RepeatType = z.infer<typeof RepeatSchema>;

// Category
export const CategorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  color: z.string(),
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(15, 'Name must be at most 15 characters'),
  maxAmount: z.number().gte(0, 'Max amount must be greater than 0').nullish(),
});

export type CategoryType = z.infer<typeof CategorySchema>;

export const CategoryCreateSchema = CategorySchema.omit({ id: true });

export type CategoryCreateType = z.infer<typeof CategoryCreateSchema>;

// Event
export const EventBaseSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must be at most 30 characters'),
  amount: z
    .number()
    .gte(0, 'Amount must be greater than 0')
    .max(MAX_NUMBER_VALUE, `Amount must be less than ${MAX_NUMBER_VALUE}`),
  description: z
    .string()
    .trim()
    .max(300, 'Description must be at most 300 characters')
    .nullable()
    .optional(),
  date: z.number(),
  originalDate: z.number().nullable().optional(),
  completedDates: z.array(z.number()).nullable().optional(),
  type: z.enum(['income', 'expense']),
  repeat: z.object({
    type: RepeatSchema,
    times: z
      .number()
      .gte(1, 'Times must be greater than 0')
      .max(MAX_TIME_REPEAT, `Times must be less than ${MAX_TIME_REPEAT}`),
    isAlways: z.boolean().nullable(),
    currentTimes: z.number().nullable().optional(),
  }),
  category: CategorySchema.optional().nullable(),
  timeNotification: z.object({
    enabled: z.boolean().nullable().optional(),
    hour: z.number().gte(0, 'Hour must be greater or equal to 0'),
    minute: z.number().gte(0, 'Minute must be greater or equal to 0'),
  }),
});

export type EventBaseType = z.infer<typeof EventBaseSchema>;

export const EventFirebaseSchema = EventBaseSchema.omit({
  category: true,
}).extend({
  category: z.custom<DocumentRef>().nullable().optional(),
});

export type EventFirebaseType = z.infer<typeof EventFirebaseSchema>;

// Budget
export const EventBudgetSchema = EventBaseSchema.extend({
  completed: z.boolean().nullable().optional(),
  balance: z.number(),
});

export type EventBudgetType = z.infer<typeof EventBudgetSchema>;

export const BudgetBaseSchema = z.object({
  id: z.string(),
  deleted: z.boolean().nullable(),
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must be at most 30 characters'),
  description: z
    .string()
    .trim()
    .max(50, 'Description must be at most 50 characters')
    .nullable(),
  initialBalance: z
    .number()
    .gte(0, 'Initial balance must be greater than 0')
    .max(
      MAX_NUMBER_VALUE,
      `Initial balance must be less than ${MAX_NUMBER_VALUE}`
    ),
  startDate: z.number(),
  endMonths: z.number(),
  events: z.array(EventBaseSchema).min(1, 'At least one event'),
  userId: z.string(), // User email that owns the budget
  emailsFrom: z.array(z.string().email('Invalid email format')),
  emailsUser: z.array(z.string().email('Invalid email format')),
});

export type BudgetBaseType = z.infer<typeof BudgetBaseSchema>;

export const BudgetExtendedSchema = BudgetBaseSchema.extend({
  eventsArchived: z.array(EventBaseSchema),
});

export type BudgetExtendedType = z.infer<typeof BudgetExtendedSchema>;

export const BudgetFirebaseSchema = BudgetBaseSchema.omit({
  events: true,
}).extend({
  events: z.array(EventFirebaseSchema),
});

export type BudgetFirebaseType = z.infer<typeof BudgetFirebaseSchema>;

export const BudgetBaseCreateSchema = BudgetBaseSchema.omit({
  id: true,
  deleted: true,
}).extend({
  id: z.string().nullable().optional(),
});

export type BudgetBaseCreateType = z.infer<typeof BudgetBaseCreateSchema>;

// Monthly
export const MonthlyBalanceSchema = z.object({
  date: z.number(),
  year: z.number(),
  month: z.number(),
  incomesEvents: z.array(EventBudgetSchema),
  expensesEvents: z.array(EventBudgetSchema),
  budget: z.object({
    incomes: z.number(),
    relIncomes: z.number(),
    expenses: z.number(),
    relExpenses: z.number(),
    available: z.number(),
    relAvailable: z.number(),
    monthlyBalance: z.number(),
    relMonthlyBalance: z.number(),
    globalBalance: z.number(),
    relGlobalBalance: z.number(),
    flowBalance: z.array(EventBudgetSchema),
  }),
});

export type MonthlyBalanceType = z.infer<typeof MonthlyBalanceSchema>;

// Line Plot (this must be define for the new lib of charts): this is for render the monthly balance on a line plot for expenses, incomes and balance
export const BudgetLinePlotSchema = z.object({
  labels: z.array(z.string()),
  legend: z.array(z.string()),
  datasets: z.array(
    z.object({
      color: z.string(),
      data: z.array(z.number()),
    })
  ),
});

export type BudgetLinePlotType = z.infer<typeof BudgetLinePlotSchema>;

// Stacked Bar Plot (this must be define for the new lib of charts): this is for render the categories amount distribution on a bar plot
export const CategoryAmountSchema = CategorySchema.extend({
  amount: z.number(),
  amountMonthly: z.number(),
  amountYearly: z.number(),
  maxAmount: z.number().gte(0, 'Max amount must be greater than 0'),
  events: z.array(EventBaseSchema),
});

export type CategoryAmountType = z.infer<typeof CategoryAmountSchema>;

export const CategoryStackedBarPlotSchema = z.object({
  labels: z.array(z.string()),
  legend: z.array(z.string()),
  barColors: z.array(z.string()),
  data: z.array(z.array(z.number())),
});

export type CategoryStackedBarPlotType = z.infer<
  typeof CategoryStackedBarPlotSchema
>;

// Budget Builder
export const BuildBudgetBuilderSchema = z.object({
  monthsScheduleLinePlot: BudgetLinePlotSchema,
  monthsSchedule: z.array(MonthlyBalanceSchema),
  categoriesAmountGroup: z.array(CategoryAmountSchema),
});

export type BuildBudgetBuilderType = z.infer<typeof BuildBudgetBuilderSchema>;

// Toggle completed event

export const ToggleCompletedEventParamsSchema = z.object({
  budgetId: z.string(),
  eventId: z.string(),
  currentCompleted: z.boolean(),
  targetDate: z.number(), // Current date to toggle the completed event
});

export type ToggleCompletedEventParamsType = z.infer<
  typeof ToggleCompletedEventParamsSchema
>;

export const BulkToggleCompletedEventParamsSchema = z.object({
  budgetId: z.string(),
  events: z.array(
    z.object({
      eventId: z.string(),
      toggleType: z.enum(['completed', 'balance']),
      currentCompleted: z.boolean(),
      targetDate: z.number(), // Current date to toggle the completed event
    })
  ),
});

export type BulkToggleCompletedEventParamsType = z.infer<
  typeof BulkToggleCompletedEventParamsSchema
>;

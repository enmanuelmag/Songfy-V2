import z from 'zod';

import { MAX_NUMBER_VALUE, MAX_TIME_REPEAT } from '@constants/app';

import { RepeatSchema } from './budget';

import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';


type DocumentRef = FirebaseFirestoreTypes.DocumentReference;

// Payment
export const PaymentSchema = z.object({
  id: z.string(),
  date: z.number(),
  description: z
    .string()
    .trim()
    .min(3, 'Description must be at least 3 characters')
    .max(50, 'Description must be at most 50 characters'),
  amount: z
    .number()
    .gte(0, 'Amount must be greater than 0')
    .max(MAX_NUMBER_VALUE, `Amount must be less than ${MAX_NUMBER_VALUE}`),
  attachment: z.string().nullable().optional(),
  deleted: z.boolean().nullable(),
});

export type PaymentType = z.infer<typeof PaymentSchema>;

export const PaymentFirebaseSchema = PaymentSchema.omit({ attachment: true }).extend({
  attachment: z.string().nullable().optional(),
});

export type PaymentFirebaseType = z.infer<typeof PaymentFirebaseSchema>;

// Debtor
export const DebtorSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must be at most 30 characters'),
  description: z.string().nullable(),
  factor: z
    .number()
    .gte(0, 'Factor must be greater than 0')
    .max(100, 'Factor must be less than 100'),
  deleted: z.boolean().nullable(),
  // update debtor wont affect this field. For this field use the addPayment, updatePayment and deletePayment
  payments: z.array(PaymentSchema),
});

export type DebtorType = z.infer<typeof DebtorSchema>;

export const DebtorsCreateSchema = DebtorSchema.omit({ id: true });

export type DebtorsCreateType = z.infer<typeof DebtorsCreateSchema>;

export const DebtorScheduleSchema = DebtorSchema.extend({
  debt: z.number(),
  targetPayment: z.number(),
  pendingPayments: z.number(),
  lastPaymentDate: z.number().nullable().optional(),
});

export type DebtorScheduleType = z.infer<typeof DebtorScheduleSchema>;

// Charge
export const ChargeSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(15, 'Must be at most 15 characters'),
  description: z.string().nullable(),
  amount: z
    .number()
    .gt(0, 'Must be greater than 0')
    .max(MAX_NUMBER_VALUE, `Amount must be less than ${MAX_NUMBER_VALUE}`),
  startChargeDate: z.number(), // Default to today but also allow to set a date
  repeat: z.object({
    type: RepeatSchema,
    times: z
      .number()
      .gte(1, 'Times must be greater than 0')
      .max(MAX_TIME_REPEAT, `Times must be less than ${MAX_TIME_REPEAT}`),
    isAlways: z.boolean().nullable(),
  }),
  deleted: z.boolean().nullable(),
  userId: z.string(),
  // update charge wont affect this field. For this field use the addDebtor, updateDebtor and deleteDebtor
  debtors: z.array(DebtorSchema).min(1, 'At least one debtor'),
});

export type ChargeType = z.infer<typeof ChargeSchema>;

export const ChargeScheduleSchema = ChargeSchema.omit({ debtors: true }).extend({
  debtors: z.array(DebtorScheduleSchema),
  totalDebt: z.number(),
  nextCharge: z.number(),
});

export type ChargeScheduleType = z.infer<typeof ChargeScheduleSchema>;

export const ChargeCreateSchema = ChargeSchema.omit({ id: true });

export type ChargeCreateType = z.infer<typeof ChargeCreateSchema>;

// Firebase API response
export const ChargesFirebaseSchema = ChargeSchema.omit({ debtors: true }).extend({
  debtors: z.array(z.custom<DocumentRef>()),
});

export type ChargesFirebaseType = z.infer<typeof ChargesFirebaseSchema>;

export const DebtorsFirebaseSchema = DebtorSchema.omit({ payments: true }).extend({
  payments: z.array(z.custom<DocumentRef>()),
});

export type DebtorsFirebaseType = z.infer<typeof DebtorsFirebaseSchema>;

// CRUD
// Debts
export const AddDebtorParamsSchema = z.object({
  chargeId: z.string(),
  debtor: DebtorSchema,
});

export type AddDebtorParamsType = z.infer<typeof AddDebtorParamsSchema>;

export const UpdateDebtorParamsSchema = z.object({
  debtorId: z.string(),
  debtor: DebtorSchema.partial(),
});

export type UpdateDebtorParamsType = z.infer<typeof UpdateDebtorParamsSchema>;

export const DeleteDebtorParamsSchema = z.object({
  chargeId: z.string(),
  debtorId: z.string(),
});

export type DeleteDebtorParamsType = z.infer<typeof DeleteDebtorParamsSchema>;

// Add payment
export const AddPaymentParamsSchema = z.object({
  debtorId: z.string(),
  payment: PaymentSchema,
});

export type AddPaymentParamsType = z.infer<typeof AddPaymentParamsSchema>;

// Update payment
export const UpdatePaymentParamsSchema = z.object({
  paymentId: z.string(),
  payment: PaymentSchema.partial(),
});

export type UpdatePaymentParamsType = z.infer<typeof UpdatePaymentParamsSchema>;

// Delete payment
export const DeletePaymentParamsSchema = z.object({
  debtorId: z.string(),
  paymentId: z.string(),
});

export type DeletePaymentParamsType = z.infer<typeof DeletePaymentParamsSchema>;

export const PaymentFileParamsSchema = z.object({
  paymentId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
});

export type PaymentFileParamsType = z.infer<typeof PaymentFileParamsSchema>;

export const PaymentFile = z.object({
  fileName: z.string(),
  uri: z.string(),
  mimeType: z.string(),
});

export type PaymentFileType = z.infer<typeof PaymentFile>;

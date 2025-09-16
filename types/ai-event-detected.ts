import z from 'zod';

// AI Detected Event
export const AIDetectedEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  emailId: z.string().optional(), // ID del email original
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Confidence level for email data belongs to Finance transactions'
    ),
  amount: z.object({
    value: z.number().describe('Amount value'),
    currency: z.string().describe('Currency of the amount'),
  }),
  type: z.enum(['income', 'expense']),
  // Extra fields by AI
  name: z.string(),
  description: z.string().optional(),
  detectedDate: z.number(),
  estimatedDate: z.number(), // Fecha estimada de la transacción
  status: z.enum(['pending', 'approved', 'rejected']),
  budgetId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type AIDetectedEventType = z.infer<typeof AIDetectedEventSchema>;

export const AIDetectedEventCreateSchema = AIDetectedEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AIDetectedEventCreateType = z.infer<
  typeof AIDetectedEventCreateSchema
>;

export const AIDetectedEventUpdateSchema =
  AIDetectedEventSchema.partial().extend({
    id: z.string(),
  });

export type AIDetectedEventUpdateType = z.infer<
  typeof AIDetectedEventUpdateSchema
>;

// Params schemas
export const GetAIDetectedEventsParamsSchema = z.object({
  budgetId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type GetAIDetectedEventsParamsType = z.infer<
  typeof GetAIDetectedEventsParamsSchema
>;

export const ApproveAIEventParamsSchema = z.object({
  eventId: z.string(),
  budgetId: z.string(),
});

export type ApproveAIEventParamsType = z.infer<
  typeof ApproveAIEventParamsSchema
>;

export const RejectAIEventParamsSchema = z.object({
  eventId: z.string(),
});

export type RejectAIEventParamsType = z.infer<typeof RejectAIEventParamsSchema>;

export const UpdateAIEventParamsSchema = z.object({
  eventId: z.string(),
  updates: AIDetectedEventUpdateSchema.omit({ id: true }),
});

export type UpdateAIEventParamsType = z.infer<typeof UpdateAIEventParamsSchema>;

export const CreateAIEventParamsSchema = z.object({
  data: AIDetectedEventCreateSchema,
});

export type CreateAIEventParamsType = z.infer<typeof CreateAIEventParamsSchema>;

export const GetAIEventParamsSchema = z.object({
  eventId: z.string(),
});

export type GetAIEventParamsType = z.infer<typeof GetAIEventParamsSchema>;

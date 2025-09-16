import z from 'zod';

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().nullable().optional(),
  displayName: z.string().optional().nullable(),
  type: z.enum(['email', 'google', 'anonymous', 'apple']),
  metadata: z.object({
    alreadyDefaultCategories: z.boolean().nullable().optional(),
  }),
});

export type UserType = z.infer<typeof UserSchema>;

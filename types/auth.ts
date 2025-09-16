import z from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
  withGoogle: z.boolean().optional().nullable(),
});

export type LoginType = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: z.string().trim().email('Invalid email'),
    password: z.string().trim().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().trim().min(6, 'Password must be at least 6 characters'),
    withGoogle: z.boolean().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type RegisterType = z.infer<typeof RegisterSchema>;

export const LocalAuthMethodSchema = z.enum(['faceId', 'fingerprint', 'iris']);

export type LocalAuthMethodType = z.infer<typeof LocalAuthMethodSchema>;

export const LocalAuth: Record<LocalAuthMethodType, string> = {
  faceId: 'Face ID',
  fingerprint: 'Fingerprint',
  iris: 'Iris',
};

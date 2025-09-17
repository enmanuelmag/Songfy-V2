import { z } from 'zod';

export const NotificationDataSchema = z.object({
  pokemonId: z.string(),
  pokemonName: z.string(),
});

export type NotificationDataType = z.infer<typeof NotificationDataSchema>;

export const NotificationForegroundSchema = z.object({
  title: z.string(),
  body: z.string(),
  data: NotificationDataSchema,
});

export type NotificationForegroundType = z.infer<
  typeof NotificationForegroundSchema
>;

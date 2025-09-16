import { z } from 'zod';

export const PageSchema = z.object({
  offset: z.number(),
  limit: z.number(),
});

export type PageType = z.infer<typeof PageSchema>;

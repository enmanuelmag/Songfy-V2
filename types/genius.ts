import { z } from 'zod';

export const SearchSongResponseSchema = z.object({
  meta: z.object({
    status: z.number(),
  }),
  response: z.object({
    hits: z.array(
      z.object({
        result: z.object({
          id: z.number(),
          title: z.string(),
          url: z.string().url(),
        }),
      })
    ),
  }),
});

export type SearchSongResponseType = z.infer<typeof SearchSongResponseSchema>;

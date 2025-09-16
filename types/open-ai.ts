import { z } from 'zod';

import { SongAnalysisSchema, SongLyricsSchema } from './spotify';

export const SearchSongsParamsSchema = z
  .object({
    keywords: z.array(z.string()),
    brief: z.string(),
    songs: z.array(SongLyricsSchema).min(1, 'At least one song is required'),
  })
  .superRefine(({ brief, keywords }, ctx) => {
    if (!keywords.length && !brief.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['keywords', 'brief'],
        message: 'At least one of keywords or brief is required',
      });
    }
  });

export type SearchSongsParamsType = z.infer<typeof SearchSongsParamsSchema>;

// Songs analyze params
export const AnalyzeSongParamsSchema = z.object({
  url: z.string(),
  putSongLyrics: z.function().args(SongLyricsSchema).returns(z.void()),
  setStepTextAnalysis: z.function().args(z.string()).returns(z.void()),
  isLimitEnabled: z.boolean(),
  songsStored: z.record(SongLyricsSchema),
});

export type AnalyzeSongParamsType = z.infer<typeof AnalyzeSongParamsSchema>;

export const AnalyzeSongResponseSchema = z.record(SongAnalysisSchema);

export type AnalyzeSongResponseType = z.infer<typeof AnalyzeSongResponseSchema>;

// Song search response
export const SearchSongsResponseSchema = z.array(z.string());

export type SearchSongsResponseType = z.infer<typeof SearchSongsResponseSchema>;

// OpenAI-API
export const ChatCompletionSchema = z.object({
  role: z.enum(['user', 'system']),
  content: z.string(),
});

export type ChatCompletionType = z.infer<typeof ChatCompletionSchema>;

export const CompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
    completion_tokens_details: z.object({
      reasoning_tokens: z.number(),
      accepted_prediction_tokens: z.number(),
      rejected_prediction_tokens: z.number(),
    }),
  }),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
      index: z.number(),
    })
  ),
});

export type CompletionResponseType = z.infer<typeof CompletionResponseSchema>;

import { z } from 'zod';

export const SpotifyAuthSchema = z.object({
  accessToken: z.string(),
  expireIn: z.number(),
  accessTokenExpirationDate: z.string(),
  refreshToken: z.string().optional(),
  scopes: z.array(z.string()),
  tokenType: z.string(),
  userId: z.string(),
});

export type SpotifyAuthType = z.infer<typeof SpotifyAuthSchema>;

// Playlists
export const GetPlaylistsParamsSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

export type GetPlaylistsParamsType = z.infer<typeof GetPlaylistsParamsSchema>;

export const PlaylistSchema = z.object({
  collaborative: z.boolean(),
  description: z.string().optional().nullable(),
  href: z.string(),
  id: z.string(),
  images: z.array(
    z.object({
      url: z.string(),
      height: z.number().nullable(),
      width: z.number().nullable(),
    })
  ),
  name: z.string(),
  public: z.boolean(),
  tracks: z.object({
    href: z.string(),
    total: z.number(),
  }),
  type: z.string(),
  uri: z.string(),
});

export type PlaylistType = z.infer<typeof PlaylistSchema>;

export const PlaylistResponseSchema = z.object({
  href: z.string(),
  limit: z.number(),
  offset: z.number(),
  next: z.string().url().optional().nullable(),
  previous: z.string().url().optional().nullable(),
  total: z.number(),
  items: z.array(PlaylistSchema),
});

export type PlaylistResponseType = z.infer<typeof PlaylistResponseSchema>;

export const PlaylistResponseRawSchema = PlaylistResponseSchema.omit({
  items: true,
}).extend({
  items: z.array(PlaylistSchema.nullable()),
});

export type PlaylistResponseRawType = z.infer<typeof PlaylistResponseRawSchema>;

// Songs
export const SongBaseSchema = z.object({
  album: z.object({
    artists: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    ),
    href: z.string().optional().nullable(),
    id: z.string().optional().nullable(),
    images: z.array(
      z.object({
        height: z.number().nullable().optional(),
        url: z.string(),
        width: z.number().nullable().optional(),
      })
    ),
    name: z.string(),
    release_date: z.string().optional().nullable(),
    total_tracks: z.number().optional().nullable(),
  }),
  artists: z.array(
    z.object({
      id: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
    })
  ),
  duration_ms: z.number(),
  explicit: z.boolean(),
  href: z.string().optional().nullable(),
  id: z.string(),
  is_local: z.boolean(),
  name: z.string(),
  popularity: z.number(),
  preview_url: z.string().nullable().optional(),
  track_number: z.number(),
  type: z.string(),
});

export const SongSchema = z.object({
  track: SongBaseSchema,
});

export type SongType = z.infer<typeof SongSchema>;

export const SongAnalysisSchema = z.object({
  keywords: z
    .array(
      z
        .string()
        .min(3, 'Keywords must have at least 3 characters')
        .max(20, 'Keywords must have at most 20 characters')
    )
    .min(7, 'Keywords must have at least 7 keywords')
    .max(14, 'Keywords must have at most 14 keywords'),
  brief: z
    .string()
    .min(20, 'Brief must have at least 20 characters')
    .max(400, 'Brief must have at most 400 characters'),
});

export type SongAnalysisType = z.infer<typeof SongAnalysisSchema>;

export const SongLyricsSchema = SongBaseSchema.extend({
  lyrics: z.string().optional().nullable(),
  analysis: SongAnalysisSchema.optional().nullable(),
});

export type SongLyricsType = z.infer<typeof SongLyricsSchema>;

// Forms
export const SongLyricsFormSchema = z.object({
  analysis: SongAnalysisSchema,
});

export type SongLyricsFormType = z.infer<typeof SongLyricsFormSchema>;

export const SearchSongLyricsFormSchema = z
  .object({
    keywords: z
      .array(z.string())
      .max(20, 'Keywords must have at most 20 keywords'),
    brief: z.string().max(500, 'Brief must have at most 300 characters'),
  })
  .superRefine(({ brief, keywords }, ctx) => {
    const emptyKeywords = keywords.length === 0;
    const emptyBrief = brief.length === 0;

    if (emptyKeywords && emptyBrief) {
      ctx.addIssue({
        message: 'Keywords and brief are required',
        path: ['keywords', 'brief'],
        code: 'custom',
      });
    }

    if (emptyKeywords && !emptyBrief && brief.length < 20) {
      ctx.addIssue({
        message: 'Brief must have at least 20 characters',
        path: ['brief'],
        code: 'custom',
      });
    }

    if (emptyBrief && !emptyKeywords && keywords.length < 3) {
      ctx.addIssue({
        message: 'Keywords must have at least 3 keywords',
        path: ['keywords'],
        code: 'custom',
      });
    }
  });

export type SearchSongLyricsFormType = z.infer<
  typeof SearchSongLyricsFormSchema
>;

export const SongLyricsStoreSchema = z.record(SongLyricsSchema);

export type SongLyricsStoreType = z.infer<typeof SongLyricsStoreSchema>;

// Params
export const GetSongsParamsSchema = z.object({
  url: z.string(),
});

export type GetSongsParamsType = z.infer<typeof GetSongsParamsSchema>;

export const GetSongsLyricsParamsSchema = z.object({
  songs: z.array(SongSchema),
  putSongLyrics: z.function().args(SongLyricsSchema).returns(z.void()),
  songsStored: z.record(SongLyricsSchema),
});

export type GetSongsLyricsParamsType = z.infer<
  typeof GetSongsLyricsParamsSchema
>;

// Song Response and Raw
export const SongResponseSchema = z.object({
  href: z.string(),
  limit: z.number(),
  next: z.string().url().optional().nullable(),
  offset: z.number(),
  previous: z.string().url().optional().nullable(),
  total: z.number(),
  items: z.array(SongSchema),
});

export type SongResponseType = z.infer<typeof SongResponseSchema>;

export const SongResponseRawSchema = SongResponseSchema.omit({
  items: true,
}).extend({
  items: z.array(SongSchema.nullable()),
});

export type SongResponseRawType = z.infer<typeof SongResponseRawSchema>;

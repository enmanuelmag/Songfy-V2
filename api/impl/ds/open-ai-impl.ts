import * as Clipboard from 'expo-clipboard';

import OpenAIDS from '@api/domain/ds/open-ai-ds';
import {
  AnalyzeSongResponseSchema,
  SearchSongsResponseSchema,
} from '@customTypes/open-ai';
import { Logger } from '@utils/log';
import { toast } from '@utils/notifications';

import SpotifyAuthExternal from './spotify-impl';

import type {
  AnalyzeSongParamsType,
  ChatCompletionType,
  CompletionResponseType,
  SearchSongsParamsType,
} from '@customTypes/open-ai';
import type { SongLyricsType } from '@customTypes/spotify';

const MODEL = 'gpt-4o-mini';

const MAX_CHARACTERS = 5_000;

const RANGES = {
  KEYWORDS: {
    MIN: 7,
    MAX: 14,
  },
  BRIEF: {
    MIN: 225,
    MAX: 300,
  },
};

type ConfigType = {
  baseURL: string;
  headers: Record<string, string>;
};

const PROMPT = `You will tell to the user according to the lyrics of these songs AT LEAST ${RANGES.KEYWORDS.MIN} AND MAX ${RANGES.KEYWORDS.MAX} keywords (about the mood of the song, feeling, motive, context, etc) and a description AT LEAST ${RANGES.BRIEF.MIN} AND MAX ${RANGES.BRIEF.MAX} characters. The output format must be ONLY a JSON object with a key (Song ID) and as value a JSON with the keys keywords (a string array) and the key brief (string). Both keywords and brief MUST BE in ENGLISH. Here are the songs:\n`;

class OpenAIExternal extends OpenAIDS {
  private static instance?: OpenAIExternal;
  private config: ConfigType;

  // External services
  private spotifyService = SpotifyAuthExternal.getInstance();

  constructor() {
    super();

    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      Logger.error('OpenAI API Key not found');
      toast({
        title: 'OpenAI API Key not found',
        preset: 'error',
      });
      throw new Error('OpenAI API Key not found');
    }

    this.config = {
      baseURL: 'https://api.openai.com/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'OpenAI-Organization': 'org-dQxjvbiGKfNmLUClgAwg0izH',
        'OpenAI-Project': 'proj_nGePA1gFvIxlfW1ewLC7sLTq',
        'Content-Type': 'application/json',
      },
    };
  }

  public static getInstance() {
    if (!OpenAIExternal.instance) {
      OpenAIExternal.instance = new OpenAIExternal();
    }

    return OpenAIExternal.instance;
  }

  async parseContent(content: string) {
    try {
      const result = JSON.parse(
        content.replaceAll('json', '').replaceAll('`', '').replaceAll('\n', '')
      );

      if (process.env.EXPO_PUBLIC_IS_DEV === 'true') {
        await Clipboard.setStringAsync(
          JSON.stringify(
            {
              content,
              result,
            },
            null,
            2
          )
        );
      }

      return result;
    } catch (error) {
      Logger.error('Error parsing content', error);
      // throw ErrorService.getErrorFromCode(
      //   ErrorCodes.ERROR_PARSING_CONTENT_ANALYZE
      // );
      throw new Error('Error parsing content');
    }
  }

  buildAnalyzePrompts(
    songs: Array<SongLyricsType>,
    songsStored: Record<string, SongLyricsType>
  ) {
    const promptsUser: Array<ChatCompletionType> = [
      { role: 'user', content: '' },
    ];

    let idxPrompt = 0;
    for (const song of songs) {
      const { id, name, lyrics } = song;

      if (!lyrics?.length) {
        Logger.error('Empty lyrics', id, name);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (songsStored[id]?.analysis) {
        Logger.debug('Analysis already done', id, name);
        continue;
      }

      const promptItem = promptsUser[idxPrompt];

      if (promptItem.content.length + lyrics.length > MAX_CHARACTERS) {
        idxPrompt++;
        promptsUser.push({ role: 'user', content: '' });
      }

      promptsUser[idxPrompt].content += `SongID: ${id}\n${lyrics}\n\n`;
    }

    return promptsUser;
  }

  async analyzeSongs(params: AnalyzeSongParamsType) {
    Logger.debug('Analyzing songs', !!params);

    try {
      const {
        putSongLyrics,
        songsStored,
        isLimitEnabled,
        setStepTextAnalysis,
      } = params;

      const songs = await this.spotifyService.getSongByPlaylist(params);

      if (isLimitEnabled) {
        toast({
          title: `Songs: ${songs.length} [Limited ${isLimitEnabled}]`,
          preset: 'done',
        });
      }

      setStepTextAnalysis(`Getting lyrics for ${songs.length} songs`);

      const songsLyrics = await this.spotifyService.getLyricsSongs({
        putSongLyrics,
        songsStored,
        songs: isLimitEnabled ? songs.slice(0, 5) : songs,
      });

      Logger.debug('Starting request analyze songs', songsLyrics.length);

      const prompts = this.buildAnalyzePrompts(songsLyrics, songsStored);

      const promptsPromises = prompts.map(async (prompt) => {
        if (!prompt.content.length) {
          Logger.debug('Empty prompt');
          return;
        }

        const messages: Array<ChatCompletionType> = [
          { role: 'system', content: PROMPT },
          prompt,
        ];

        const response = await fetch(this.config.baseURL, {
          method: 'POST',
          headers: this.config.headers,
          body: JSON.stringify({
            model: MODEL,
            messages,
          }),
        });

        const songsAnalyzed = (await response.json()) as CompletionResponseType;

        if (response.status !== 200) {
          Logger.error('Error request analyze songs', songsAnalyzed);
          // throw ErrorService.getErrorFromCode(
          //   ErrorCodes.ERROR_REQUEST_COMPLETION
          // );
          throw new Error('Error request analyze songs');
        }

        const [choice] = songsAnalyzed.choices;

        if (!choice.message.content) {
          Logger.error('Message content is empty', choice.message);
          // throw ErrorService.getErrorFromCode(
          //   ErrorCodes.ERROR_PARSING_CONTENT_ANALYZE
          // );
          throw new Error('Message content is empty');
        }

        const content = await this.parseContent(choice.message.content);

        const { success, error, data } =
          AnalyzeSongResponseSchema.safeParse(content);

        if (!success) {
          Logger.error('Error parsing content songs', error.format());
          // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_ANALYZING_SONGS);
          throw new Error('Error parsing content songs');
        }

        for (const [id, analysis] of Object.entries(data)) {
          const updateSong = songsLyrics.find((song) => song.id === id);

          if (updateSong) {
            Logger.debug('Updating song', id, updateSong.name);
          } else {
            Logger.error(
              'Error updating song',
              `[${id}]`,
              Object.keys(songsStored)
            );
            continue;
          }

          updateSong.analysis = analysis;
          putSongLyrics(updateSong);
        }
      });

      setStepTextAnalysis('Analyzing songs');

      const results = await Promise.allSettled(promptsPromises);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
          Logger.error('Error settle songs', i, result.reason);
        }
      }

      return true;
    } catch (error) {
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      Logger.error('Error global analyze songs', error);
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_ANALYZING_SONGS);
      throw new Error('Error global analyze songs');
    }
  }

  buildSearchPrompts(params: SearchSongsParamsType) {
    const { keywords, brief, songs } = params;
    const promptsUser: Array<ChatCompletionType> = [];

    promptsUser.push({
      role: 'system',
      content:
        'You will receive messages, each one contains the ID song, brief, keyword and the complete lyric of song. The last message contains only keywords and brief target. You must return a list that contains the ID song that has the most similar keywords or brief of lyrics to the search, also analyze the lyric with the target brief. The output format must be ONLY a list of string (ID songs)',
    });

    for (const song of songs) {
      const { id, name, lyrics, analysis } = song;

      const info = [];

      if (analysis?.keywords) {
        info.push(`Keywords: ${analysis.keywords.join(', ')}`);
      }
      if (analysis?.brief) {
        info.push(`Brief: ${analysis.brief}`);
      }
      if (lyrics) {
        info.push(`Lyrics:\n${lyrics}`);
      }

      if (!info.length) {
        Logger.error('Empty song info', id, name);
        continue;
      }

      promptsUser.push({
        role: 'user',
        content: `SongID: ${id}\n${info.join('\n')}\n\n`,
      });
    }

    promptsUser.push({
      role: 'user',
      content: `Target Keywords: ${keywords.join(
        ', '
      )}\nTarget Brief: ${brief}\nReturn only the ID songs that have the most similar keywords or brief of lyrics to the search, most similar first. Format like this: ["ID1", "ID2", "ID3"]`,
    });

    return promptsUser;
  }

  async searchSongs(params: SearchSongsParamsType) {
    Logger.debug('Searching songs', !!params);

    try {
      const messages = this.buildSearchPrompts(params);

      const response = await fetch(this.config.baseURL, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify({
          model: MODEL,
          messages,
        }),
      });

      const songsAnalyzed = (await response.json()) as CompletionResponseType;

      if (response.status !== 200) {
        Logger.error('Error searching songs', songsAnalyzed);
        // throw ErrorService.getErrorFromCode(
        //   ErrorCodes.ERROR_REQUEST_COMPLETION
        // );
        throw new Error('Error searching songs');
      }

      const [choice] = songsAnalyzed.choices;

      if (!choice.message.content) {
        Logger.error('Message content is empty', choice.message);
        // throw ErrorService.getErrorFromCode(
        //   ErrorCodes.ERROR_MESSAGE_CONTENT_SEARCH
        // );
        throw new Error('Message content is empty');
      }

      const { success, error, data } = SearchSongsResponseSchema.safeParse(
        JSON.parse(choice.message.content)
      );

      if (!success) {
        Logger.error('Error parsing content', error.format());
        // throw ErrorService.getErrorFromCode(
        //   ErrorCodes.ERROR_PARSING_CONTENT_SEARCH
        // );
        throw new Error('Error parsing content');
      }

      const resultSongs: Array<SongLyricsType> = [];

      for (const id of data) {
        const song = params.songs.find((s) => s.id === id);

        if (!song) {
          Logger.error('Song not found', id);
          continue;
        }

        resultSongs.push(song);
      }

      return resultSongs;
    } catch (error) {
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      Logger.error('Error searching songs', error);
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_SEARCHING_SONGS);
      throw new Error('Error searching songs');
    }
  }
}

export default OpenAIExternal;

import IDOMParser from 'advanced-html-parser';
import moment from 'moment';
import { z } from 'zod';

import { ResponseType, loadAsync, makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

// import * as Clipboard from 'expo-clipboard';

import queryClient from '@api/datasource/query';
import SpotifyDS from '@api/domain/ds/spotify-ds';
import { SPOTIFY_AUTH } from '@constants/datasource';
import QKeys from '@constants/react-api';
import { PlaylistResponseRawSchema, SongSchema } from '@customTypes/spotify';
import { Logger } from '@utils/log';

import type { SearchSongResponseType } from '@customTypes/genius';
import type {
  GetPlaylistsParamsType,
  GetSongsLyricsParamsType,
  GetSongsParamsType,
  PlaylistResponseType,
  SongLyricsType,
  SongResponseRawType,
  SongType,
} from '@customTypes/spotify';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_API = 'https://api.spotify.com';

const SPOTIFY_API_VERSION = 'v1';

const GENIUS_API = 'https://api.genius.com';

const TOKEN_EXPIRED = 'The access token expired';

const ROOT_CONTAINER = 'lyrics-root';

const ATTRIBUTE_LYRICS = 'div[data-lyrics-container="true"]';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

class SpotifyAuthExternal extends SpotifyDS {
  private static instance: SpotifyAuthExternal;

  private constructor() {
    super();
  }

  public static getInstance() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!SpotifyAuthExternal.instance) {
      SpotifyAuthExternal.instance = new SpotifyAuthExternal();
    }

    return SpotifyAuthExternal.instance;
  }

  async authorize() {
    try {
      Logger.debug('Authorizing Spotify');
      const result = await loadAsync(
        {
          usePKCE: false,
          responseType: ResponseType.Token,
          clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
          clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET,
          scopes: ['user-read-email', 'playlist-read-private'],
          redirectUri: makeRedirectUri({
            scheme: 'dev.cardor.enmanuelmag.songfy',
          }),
          extraParams: {
            grant_type: 'authorization_code',
            access_type: 'offline',
          },
        },
        discovery
      );

      const response = await result.promptAsync(discovery, {
        url: result.url!,
      });

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (response?.type !== 'success') {
        Logger.error('Error authorizing Spotify', response);
        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_AUTHORIZING);
        throw new Error('Error authorizing Spotify');
      }

      Logger.debug(
        'Spotify authorized successfully',
        JSON.stringify(response.params, null, 2)
      );

      this.saveToken(response.params.access_token);

      return true;
    } catch (error) {
      Logger.error('Error authorizing Spotify', error);
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_AUTHORIZING);
      throw new Error('Error authorizing Spotify');
    }
  }

  async getCode(): Promise<string | null> {
    try {
      const code = await SecureStore.getItemAsync(SPOTIFY_AUTH);

      if (code) {
        return code;
      }

      return null;
    } catch (error) {
      Logger.error('Error getting code', error);
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_CODE);
      throw new Error('Error getting code');
    }
  }

  async saveToken(token: string) {
    try {
      Logger.debug('Saving token', token);
      await SecureStore.setItemAsync(SPOTIFY_AUTH, token);

      Logger.debug('Token saved successfully');

      return true;
    } catch (error) {
      Logger.error('Error authorizing Spotify', error);
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_SAVING_TOKEN);
      throw new Error('Error authorizing Spotify');
    }
  }

  async checkToken(sentTokenAt?: number) {
    try {
      Logger.debug('Checking token', sentTokenAt);
      const currentMoment = moment();

      let expired = true;

      if (sentTokenAt) {
        const diff = currentMoment.diff(moment.unix(sentTokenAt), 'seconds');

        Logger.debug('Token diff', diff);

        if (diff < 3600) {
          expired = false;
        }
      }

      if (expired) {
        await this.logout();
        return false;
      }

      const code = await this.getCode();

      Logger.debug('Token from secret', !!code);

      if (code) return true;

      return false;
    } catch (error) {
      Logger.error('Error checking token', error);
      return false;
    }
  }

  async logout() {
    try {
      Logger.debug('Logging out');
      await SecureStore.deleteItemAsync(SPOTIFY_AUTH);
    } catch (error) {
      Logger.error('Error logging out', error);
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_LOGGING_OUT);
      throw new Error('Error logging out');
    }
  }

  getURL(url: string, endpoint: string, params: Record<string, string>) {
    const _url = new URL(url);

    _url.pathname = endpoint;

    Object.entries(params).forEach(([key, value]) => {
      if (!value) return;

      _url.searchParams.append(key, value);
    });

    return _url.toString();
  }

  async getPlaylists(params: GetPlaylistsParamsType) {
    try {
      // Logger.debug('Getting playlists', params);
      const token = await this.getCode();

      if (!token) {
        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_CODE);
        throw new Error('Error getting code');
      }

      const { offset, limit = 50 } = params;

      const url = this.getURL(
        SPOTIFY_API,
        `${SPOTIFY_API_VERSION}/me/playlists`,
        {
          limit: limit.toString(),
          offset: offset.toString(),
        }
      );

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const dataJson = await response.json();

      if (!response.ok) {
        Logger.error('Error getting playlists', dataJson);

        if (dataJson.error.message === TOKEN_EXPIRED) {
          this.logout();

          await queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === QKeys.CHECK_SPOTIFY_TOKEN_KEY,
          });

          // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_TOKEN_EXPIRED);
          throw new Error('Token expired');
        }

        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_PLAYLISTS);
        throw new Error('Error getting playlists');
      }

      const { success, error, data } =
        PlaylistResponseRawSchema.safeParse(dataJson);

      if (!success) {
        Logger.error('Error parsing playlists', JSON.stringify(error.format()));
        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_PARSING_PLAYLIST);
        throw new Error('Error parsing playlists');
      } else {
        Logger.debug('Playlists parsed successfully');
      }

      data.items = data.items.filter(Boolean);

      return data as PlaylistResponseType;
    } catch (error) {
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_PLAYLISTS);
      Logger.error('Error getting playlists', error);
      throw new Error('Error getting playlists');
    }
  }

  async getSongByPlaylist(params: GetSongsParamsType) {
    try {
      Logger.debug('Getting songs by playlist');
      const token = await this.getCode();

      if (!token) {
        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_CODE);
        throw new Error('Error getting code');
      }

      const { url } = params;

      const songsPlaylist: Array<SongType> = [];

      let nextURL: string | null | undefined = url;
      let idx = 1;

      do {
        Logger.debug('Getting songs by playlist page:', idx);
        const response = await fetch(nextURL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const dataJson = await response.json();

          const castDataJson = dataJson as SongResponseRawType;

          const songsFiltered = castDataJson.items.filter(
            (item) => item?.track.id
          ) as Array<SongType>;

          songsPlaylist.push(...songsFiltered);

          if (dataJson.next) {
            nextURL = castDataJson.next;
          } else {
            Logger.debug('No more songs by playlist');
            nextURL = undefined;
          }
        } else {
          Logger.error('Error getting songs by playlist', response);
          // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_SONGS);
          throw new Error('Error getting songs by playlist');
        }

        idx++;
      } while (nextURL);

      Logger.debug('Songs by playlist fetched successfully');

      const { success, error, data } = z
        .array(SongSchema)
        .safeParse(songsPlaylist);

      if (!success) {
        Logger.error('Error parsing list', JSON.stringify(error.format()));
        // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_PARSING_PLAYLIST);
        throw new Error('Error parsing list');
      } else {
        Logger.debug('Songs parsed successfully', data.length);
      }

      return data;
    } catch (error) {
      // if (error instanceof ErrorService) {
      //   throw error;
      // }
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_SONGS);
      Logger.error('Error getting songs by playlist', error);
      throw new Error('Error getting songs by playlist');
    }
  }

  async getLyricsSongs(params: GetSongsLyricsParamsType) {
    try {
      const { songs, putSongLyrics, songsStored } = params;

      Logger.debug('Getting lyrics songs', songs.length);

      const lyricsPromises = songs.map(async ({ track }) => {
        const { name, artists, id } = track;

        const songStored = songsStored[id];

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (songStored && songStored.lyrics?.length) {
          Logger.debug(
            'Song already stored with lyrics',
            songStored.id,
            songStored.name
          );
          return songStored;
        }

        const artistNames = artists
          .map((artist) => artist.name)
          .filter(Boolean)
          .join(' ');

        const urlSearch = this.getURL(GENIUS_API, 'search', {
          q: `${name} ${artistNames}`,
        });

        Logger.info('URL Search', `${name} ${artistNames}`, urlSearch);

        const searchResponse = await fetch(urlSearch, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_GENIUS_ACCESS_TOKEN}`,
          },
        });

        const searchJson =
          (await searchResponse.json()) as SearchSongResponseType;

        const [result] = searchJson.response.hits;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!result) {
          Logger.error('Error getting genius info song', searchJson);

          return {
            ...track,
            lyrics: null,
          };
        }

        const {
          result: { url },
        } = result;

        const lyricsResponse = await fetch(url, {
          method: 'GET',
        });

        const lyricsText = await lyricsResponse.text();

        const doc = IDOMParser.parse(lyricsText, {
          ignoreTags: ['script', 'style', 'head'],
          onlyBody: true,
        });

        const lyricsContainer = doc
          .getElementById(ROOT_CONTAINER)
          ?.querySelector(ATTRIBUTE_LYRICS);

        if (!lyricsContainer) {
          Logger.error('Error getting lyrics container');

          return {
            ...track,
            lyrics: null,
          };
        }

        const songLyrics = {
          ...track,
          lyrics: lyricsContainer.text(),
        };

        putSongLyrics(songLyrics);

        return songLyrics;
      });

      const promiseResults = await Promise.allSettled(lyricsPromises);

      const songsLyrics: Array<SongLyricsType> = [];

      for (const promiseResult of promiseResults) {
        if (promiseResult.status === 'fulfilled') {
          songsLyrics.push(promiseResult.value);
        } else {
          Logger.error('Error getting lyrics songs', promiseResult.reason);
        }
      }

      Logger.debug('Lyrics songs fetched successfully', songsLyrics.length);

      return songsLyrics;
    } catch (error) {
      Logger.error('Error getting lyrics songs', error);
      // throw ErrorService.getErrorFromCode(ErrorCodes.ERROR_GETTING_LYRICS);
      throw new Error('Error getting lyrics songs');
    }
  }
}

export default SpotifyAuthExternal;

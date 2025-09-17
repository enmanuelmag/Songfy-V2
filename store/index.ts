import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RoutesType } from '@constants/routes';
import type { NotificationForegroundType } from '@customTypes/notification';
import type {
  PlaylistType,
  SongLyricsStoreType,
  SongLyricsType,
} from '@customTypes/spotify';
import type { UserType } from '@customTypes/user';

type ThemeOptions = 'light' | 'dark' | string;

// User slice
type UserSlice = {
  // states
  tabSelected: RoutesType;
  user: UserType | null;
  theme: ThemeOptions;
  usedSystemTheme: boolean;
  pushToken?: string | null;
  popOverNotification?: NotificationForegroundType | null;
  tokenExpired: boolean;
  tokenSentAt?: number;
};

type UserSliceActions = {
  // actions
  clear: () => void;
  setUser: (user?: UserType | null) => void;
  setTheme: (theme: ThemeOptions) => void;
  setUsedSystemTheme: (usedSystemTheme: boolean) => void;
  setTabSelected: (tabSelected: UserSlice['tabSelected']) => void;
  setPushToken: (pushToken: string | null) => void;
  setPopOverNotification: (
    popOverNotification: NotificationForegroundType | null
  ) => void;
  setTokenExpired: (tokenExpired: boolean) => void;
  setTokenSentAt: (tokenSentAt?: number) => void;
};

const initialUserSlice: UserSlice = {
  user: null,
  theme: 'light',
  tabSelected: '/search',
  usedSystemTheme: false,
  pushToken: null,
  popOverNotification: null,
  tokenExpired: false,
};

// Spotify slice
type SpotifySlice = {
  // states
  playlists: Array<PlaylistType>;
  songsLyrics: SongLyricsStoreType;
  searchedSongs: Array<SongLyricsType>;
  searchBrief: string;
  searchKeywords: Array<string>;
  isLimitEnabled: boolean;
  stepTextAnalysis?: string | null;
};

type SpotifySliceActions = {
  // actions
  clearPlaylists: () => void;
  setPlaylists: (playlists: SpotifySlice['playlists']) => void;
  setSongsLyrics: (songsLyrics: SpotifySlice['songsLyrics']) => void;
  putSongLyrics: (songLyrics: SongLyricsType) => void;
  setSearchedSongs: (searchedSongs: SpotifySlice['searchedSongs']) => void;
  setSearchBrief: (searchBrief: string) => void;
  setSearchKeywords: (searchKeywords: Array<string>) => void;
  removeSongLyrics: (songId: string) => void;
  clearSongsLyrics: () => void;
  setLimitEnabled: (isLimitEnabled: boolean) => void;
  setStepTextAnalysis: (stepTextAnalysis: string | null) => void;
};

const initialSpotifySlice: SpotifySlice = {
  playlists: [],
  songsLyrics: {},
  searchedSongs: [],
  searchBrief: '',
  searchKeywords: [],
  isLimitEnabled: false,
  stepTextAnalysis: undefined,
};

type StoreType = UserSlice &
  UserSliceActions &
  SpotifySlice &
  SpotifySliceActions;

export const useAppStore = create(
  persist<StoreType>(
    (set) => ({
      ...initialUserSlice,
      ...initialSpotifySlice,
      // UserSlice Actions
      clear: () => set({ ...initialUserSlice, ...initialSpotifySlice }),
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setUsedSystemTheme: (usedSystemTheme) => set({ usedSystemTheme }),
      setTabSelected: (tabSelected) => set({ tabSelected }),
      setPushToken: (pushToken) => set({ pushToken }),
      setPopOverNotification: (popOverNotification) =>
        set({ popOverNotification }),
      setTokenExpired: (tokenExpired) => set({ tokenExpired }),
      setTokenSentAt: (tokenSentAt) => set({ tokenSentAt }),
      // Spotify Actions
      setPlaylists: (playlists) => set({ playlists }),
      clearPlaylists: () => set({ playlists: [] }),
      setSongsLyrics: (songsLyrics) => set({ songsLyrics }),
      putSongLyrics: (songLyrics) =>
        set((state) => ({
          songsLyrics: { ...state.songsLyrics, [songLyrics.id]: songLyrics },
        })),
      setSearchedSongs: (searchedSongs) => set({ searchedSongs }),
      setSearchBrief: (searchBrief) => set({ searchBrief }),
      setSearchKeywords: (searchKeywords) => set({ searchKeywords }),
      removeSongLyrics: (songId) =>
        set((state) => {
          const { [songId]: _, ...rest } = state.songsLyrics;
          return { songsLyrics: rest };
        }),
      clearSongsLyrics: () => set({ songsLyrics: {} }),
      setLimitEnabled: (isLimitEnabled) => set({ isLimitEnabled }),
      setStepTextAnalysis: (stepTextAnalysis) => set({ stepTextAnalysis }),
    }),
    {
      version: 1,
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      migrate(persistedState, oldVersion) {
        const castedPersistedState = persistedState as StoreType;

        if (oldVersion === 3) {
          return {
            ...castedPersistedState,
            songsLyrics: {},
          };
        }

        const newState =
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          castedPersistedState || {
            ...initialUserSlice,
            ...initialSpotifySlice,
          };

        return newState;
      },
    }
  )
);

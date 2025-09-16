import {
  GetPlaylistsParamsType,
  GetSongsLyricsParamsType,
  GetSongsParamsType,
  PlaylistResponseType,
  SongLyricsType,
  SongType,
} from '@customTypes/spotify';

abstract class SpotifyDS {
  abstract authorize(): Promise<boolean>;

  abstract saveToken(token: string): Promise<boolean>;

  abstract checkToken(sentTokenAt?: number): Promise<boolean>;

  abstract logout(): Promise<void>;

  abstract getPlaylists(
    params: GetPlaylistsParamsType
  ): Promise<PlaylistResponseType>;

  abstract getSongByPlaylist(params: GetSongsParamsType): Promise<SongType[]>;

  abstract getLyricsSongs(
    params: GetSongsLyricsParamsType
  ): Promise<SongLyricsType[]>;
}

export default SpotifyDS;

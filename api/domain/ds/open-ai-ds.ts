import {
  AnalyzeSongParamsType,
  SearchSongsParamsType,
} from '@customTypes/open-ai';
import { SongLyricsType } from '@customTypes/spotify';

abstract class OpenAIDS {
  abstract analyzeSongs(params: AnalyzeSongParamsType): Promise<boolean>;

  abstract searchSongs(
    params: SearchSongsParamsType
  ): Promise<SongLyricsType[]>;
}

export default OpenAIDS;

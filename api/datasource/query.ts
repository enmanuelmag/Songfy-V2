import { CACHED_TIME } from '@constants/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, keepPreviousData } from '@tanstack/react-query';



const queryClient = new QueryClient();

queryClient.setDefaultOptions({
  queries: {
    retry: 2,
    gcTime: CACHED_TIME,
    networkMode: 'always',
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  },
  mutations: {
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default queryClient;

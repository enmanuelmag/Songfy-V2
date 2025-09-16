import { AppStoreUpdateViewProps, ChangeEventPayload } from './src/AppStoreUpdate.types';
import AppStoreUpdateModule from './src/AppStoreUpdateModule';
import AppStoreUpdateView from './src/AppStoreUpdateView';

export const ProductID = AppStoreUpdateModule.ProductID as number;

export async function openAppStore(id: number) {
  return await AppStoreUpdateModule.openAppStore(id);
}

export { AppStoreUpdateView, AppStoreUpdateViewProps, ChangeEventPayload };

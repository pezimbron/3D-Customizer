import { AdminConfig } from './admin';

export interface ModelMetadata {
  id: string;
  name: string;
  config: AdminConfig;
}

export interface Model extends ModelMetadata {
  data?: ArrayBuffer; // Model data stored as ArrayBuffer
}

export interface ModelsState {
  models: Model[];
  selectedModelId: string | null;
}

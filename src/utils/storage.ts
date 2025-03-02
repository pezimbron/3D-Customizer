import { LightSettings } from '../components/LightingControls';

interface SavedState {
  customizations: Record<string, any>;
  lightSettings: LightSettings;
}

const STORAGE_KEY = '3D_CUSTOMIZER_STATE';

export const saveState = (state: SavedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving state:', error);
    return false;
  }
};

export const loadState = (): SavedState | null => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
};

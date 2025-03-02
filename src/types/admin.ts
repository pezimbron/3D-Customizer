export interface PartGroup {
  id: string;
  name: string;
  parts: string[];
  allowedColors: string[];
  allowMetalness: boolean;
  allowRoughness: boolean;
  colors: string[];  // Array of colors for each part
  metalness?: number[];  // Array of metalness values for each part
  roughness?: number[];  // Array of roughness values for each part
}

// New interfaces for object positioning and relationships
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Scale {
  x: number;
  y: number;
  z: number;
}

export interface ObjectTransform {
  position: Position;
  rotation: Rotation;
  scale: Scale;
}

export interface SceneObject {
  id: string;
  name: string;
  modelPath?: string;  // Path to the 3D model file if different from main model
  fileData?: ArrayBuffer;  // Raw file data for the model
  partNames: string[]; // Names of parts in the model that belong to this object
  transform: ObjectTransform;
  visible: boolean;
  isBase?: boolean;  // Is this the base object that others are positioned relative to?
}

export interface DependencyRule {
  id: string;
  sourceObjectId: string;  // The object that depends on another
  targetObjectId: string;  // The object that is depended upon
  type: 'requires' | 'excludes';  // requires = source needs target, excludes = source cannot exist with target
}

export interface SelectionGroup {
  id: string;
  name: string;
  type: 'multiple' | 'single';  // multiple = can select many, single = radio button style (only one)
  objectIds: string[];  // IDs of objects in this selection group
  defaultSelectedIds: string[];  // IDs of objects selected by default
}

export interface LightSettings {
  ambientIntensity: number;
  spotlightIntensity: number;
  pointLightIntensity: number;
  spotlightPosition: [number, number, number];
  pointLightPosition: [number, number, number];
}

export interface AdminConfig {
  partGroups: PartGroup[];
  defaultColors: string[];
  lightSettings: LightSettings;
  sceneObjects?: SceneObject[];
  dependencyRules?: DependencyRule[];
  selectionGroups?: SelectionGroup[];
  modelDimensions?: {
    position: Position;
    rotation: Rotation;
    scale: Scale;
  };
}

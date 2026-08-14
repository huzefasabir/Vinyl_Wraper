export type CategoryId = 
  | 'architectural-woods'
  | 'stone-marble'
  | 'monochrome-solids'
  | 'metallic-finishes'
  | 'carbon-fiber';

export type SubCategoryId = 
  | 'all-woods'
  | 'oak-ash'
  | 'walnut-teak'
  | 'exotic-grains'
  | 'all-stone'
  | 'calacatta'
  | 'granite'
  | 'all-solids'
  | 'super-matt'
  | 'gloss'
  | 'all-metals'
  | 'brushed'
  | 'all-carbon';

export interface PbrSpecs {
  roughness: number; // 0.0 to 1.0
  specular: number; // 0.0 to 1.0
  normalMap: string; // e.g. "Deep Emboss", "Micro Texture", "Polished Smooth"
  grainDirection: 'Vertical' | 'Horizontal' | 'Omni-directional';
  thickness: string; // e.g. "0.2mm (8 mil)"
  rollWidth: string; // e.g. "1220mm (48\")"
  adhesive: string; // e.g. "Air-Release Comply™"
  fireRating?: string; // e.g. "Class A / ASTM E84"
  durabilityYears?: number;
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: CategoryId;
  categoryName: string;
  subCategory: SubCategoryId;
  subCategoryName: string;
  finish: 'Super Matt' | 'Textured' | 'Satin' | 'High Gloss' | 'Matte Grain' | 'Brushed';
  tags: string[];
  description: string;
  imageUrl: string;
  macroUrl: string;
  colorHex: string;
  colorVariations: { hex: string; name: string }[];
  pbr: PbrSpecs;
  isNew?: boolean;
  isPremium?: boolean;
  isFireRetardant?: boolean;
}

export interface SpaceSegment {
  id: string;
  name: string; // e.g. "Upper Cabinets", "Island Countertop", "Backsplash"
  defaultMaterialSku?: string;
  appliedMaterial?: Material;
  pathCoordinates?: { x: number; y: number }[]; // Polygonal outline in normalized (0..1) coords
  boundingBox?: { x: number; y: number; width: number; height: number };
  renderParameters?: RenderParameters;
}

export interface SpaceImage {
  id: string;
  title: string;
  type: 'kitchen' | 'bathroom' | 'office' | 'custom';
  imageUrl: string;
  thumbnailUrl: string;
  aspectRatio: number;
  segments: SpaceSegment[];
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface RenderParameters {
  grainDirection: number; // 0 to 90 degrees or 0=vertical, 90=horizontal
  roughness: number; // 0 to 100%
  reflectivity: number; // 0 to 100%
  textureScale: number; // 0.5 to 3.0
  ambientLight: number; // 0 to 100%
}

export type StudioTool = 
  | 'layers'
  | 'brush'
  | 'eraser'
  | 'lasso'
  | 'select'
  | 'undo'
  | 'redo'
  | 'export';

export type SubNavSection = 
  | 'layers'
  | 'materials'
  | 'graphics'
  | 'environment';

export interface Project {
  id: string;
  name: string;
  spaceName: string;
  createdAt: string;
  thumbnailUrl: string;
  spaceImageId: string;
  appliedMaterials: {
    segmentId: string;
    segmentName: string;
    material: Material;
    params: RenderParameters;
  }[];
  notes?: string;
}

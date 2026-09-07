import { SpaceImage } from '../types';

export const PRESET_SPACES: SpaceImage[] = [
  {
    id: 'kitchen-modern',
    title: 'Modern Kitchen Renovation',
    type: 'kitchen',
    imageUrl: '/api/images/default_image/Kitchen.jpeg',
    thumbnailUrl: '/api/images/default_image/Kitchen.jpeg',
    aspectRatio: 16 / 9,
    beforeImageUrl: '/api/images/default_image/Kitchen.jpeg',
    segments: [
      {
        id: 'seg-upper-cabinets',
        name: 'Upper Wall Cabinets',
        boundingBox: { x: 0.35, y: 0.22, width: 0.38, height: 0.28 },
        pathCoordinates: [
          { x: 0.35, y: 0.22 },
          { x: 0.73, y: 0.22 },
          { x: 0.73, y: 0.50 },
          { x: 0.35, y: 0.50 }
        ],
        renderParameters: {
          grainDirection: 0,
          roughness: 82,
          reflectivity: 15,
          textureScale: 1.0,
          ambientLight: 85
        }
      },
      {
        id: 'seg-island-countertop',
        name: 'Waterfall Island Countertop',
        boundingBox: { x: 0.48, y: 0.52, width: 0.28, height: 0.38 },
        pathCoordinates: [
          { x: 0.48, y: 0.52 },
          { x: 0.76, y: 0.52 },
          { x: 0.76, y: 0.90 },
          { x: 0.48, y: 0.90 }
        ],
        renderParameters: {
          grainDirection: 45,
          roughness: 12,
          reflectivity: 88,
          textureScale: 1.2,
          ambientLight: 90
        }
      },
      {
        id: 'seg-base-units',
        name: 'Base Storage Units',
        boundingBox: { x: 0.32, y: 0.58, width: 0.22, height: 0.32 },
        pathCoordinates: [
          { x: 0.32, y: 0.58 },
          { x: 0.54, y: 0.58 },
          { x: 0.54, y: 0.90 },
          { x: 0.32, y: 0.90 }
        ],
        renderParameters: {
          grainDirection: 0,
          roughness: 74,
          reflectivity: 22,
          textureScale: 1.0,
          ambientLight: 80
        }
      },
      {
        id: 'seg-backsplash',
        name: 'Slab Backsplash',
        boundingBox: { x: 0.36, y: 0.48, width: 0.36, height: 0.12 },
        pathCoordinates: [
          { x: 0.36, y: 0.48 },
          { x: 0.72, y: 0.48 },
          { x: 0.72, y: 0.60 },
          { x: 0.36, y: 0.60 }
        ],
        renderParameters: {
          grainDirection: 0,
          roughness: 95,
          reflectivity: 5,
          textureScale: 1.0,
          ambientLight: 88
        }
      }
    ]
  },
  {
    id: 'wardrobe-modern',
    title: 'Contemporary Wardrobe Suite',
    type: 'wardrobe',
    imageUrl: '/api/images/default_image/Wardrobe.jpeg',
    thumbnailUrl: '/api/images/default_image/Wardrobe.jpeg',
    aspectRatio: 16 / 9,
    beforeImageUrl: '/api/images/default_image/Wardrobe.jpeg',
    segments: [
      {
        id: 'seg-wardrobe-doors',
        name: 'Wardrobe Cabinet Doors',
        boundingBox: { x: 0.20, y: 0.20, width: 0.60, height: 0.65 },
        renderParameters: {
          grainDirection: 0,
          roughness: 65,
          reflectivity: 35,
          textureScale: 1.1,
          ambientLight: 85
        }
      },
      {
        id: 'seg-drawers-storage',
        name: 'Lower Storage Drawers',
        boundingBox: { x: 0.20, y: 0.65, width: 0.60, height: 0.20 },
        renderParameters: {
          grainDirection: 0,
          roughness: 45,
          reflectivity: 62,
          textureScale: 1.0,
          ambientLight: 80
        }
      }
    ]
  },
  {
    id: 'washroom-luxury',
    title: 'Luxury Washroom Vanity',
    type: 'washroom',
    imageUrl: '/api/images/default_image/Washroom.jpeg',
    thumbnailUrl: '/api/images/default_image/Washroom.jpeg',
    aspectRatio: 16 / 9,
    beforeImageUrl: '/api/images/default_image/Washroom.jpeg',
    segments: [
      {
        id: 'seg-vanity-cabinet',
        name: 'Floating Vanity Body',
        boundingBox: { x: 0.25, y: 0.55, width: 0.50, height: 0.30 },
        renderParameters: {
          grainDirection: 90,
          roughness: 88,
          reflectivity: 12,
          textureScale: 1.0,
          ambientLight: 90
        }
      },
      {
        id: 'seg-vanity-top',
        name: 'Calacatta Vanity Top',
        boundingBox: { x: 0.25, y: 0.50, width: 0.50, height: 0.08 },
        renderParameters: {
          grainDirection: 0,
          roughness: 10,
          reflectivity: 90,
          textureScale: 1.4,
          ambientLight: 92
        }
      }
    ]
  }
];

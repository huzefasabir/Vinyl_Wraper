import { SpaceImage } from '../types';

export const PRESET_SPACES: SpaceImage[] = [
  {
    id: 'kitchen-modern',
    title: 'Modern Kitchen Renovation',
    type: 'kitchen',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQuJZFKqEGK-8X4BRaqMBfpDwX7IVsLdyIOy5HcKSz8NqnuOu_p0w6_ssEzWXo07BDXUlqXDCY19dtlAzh9-3oXCAkaYt4coReaYhBCRYYz0Ysya_wXsBcQmnvsXFuY9TyqRjCKojdDv1f6oyKqFIM1fF3DKwQK-vNipS2aAU2IcUMmRQXPhv7KdrPwQjBIMp_X3GvwR9tK46-7ciETAKarbFn4QOQE8LcYNROfP-R7Zhlpr1wEbI_',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQuJZFKqEGK-8X4BRaqMBfpDwX7IVsLdyIOy5HcKSz8NqnuOu_p0w6_ssEzWXo07BDXUlqXDCY19dtlAzh9-3oXCAkaYt4coReaYhBCRYYz0Ysya_wXsBcQmnvsXFuY9TyqRjCKojdDv1f6oyKqFIM1fF3DKwQK-vNipS2aAU2IcUMmRQXPhv7KdrPwQjBIMp_X3GvwR9tK46-7ciETAKarbFn4QOQE8LcYNROfP-R7Zhlpr1wEbI_',
    aspectRatio: 16 / 9,
    beforeImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQuJZFKqEGK-8X4BRaqMBfpDwX7IVsLdyIOy5HcKSz8NqnuOu_p0w6_ssEzWXo07BDXUlqXDCY19dtlAzh9-3oXCAkaYt4coReaYhBCRYYz0Ysya_wXsBcQmnvsXFuY9TyqRjCKojdDv1f6oyKqFIM1fF3DKwQK-vNipS2aAU2IcUMmRQXPhv7KdrPwQjBIMp_X3GvwR9tK46-7ciETAKarbFn4QOQE8LcYNROfP-R7Zhlpr1wEbI_',
    afterImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeY9Vj8PDpu-0VphwfKJ8bfKDstbwmN8dT0QukCeUoROts61UpKYAy3r98thmuwyyff6jvqBf6lK48DxI7A7G7_CpsB_Wg8OzGyiUOm7dtIofuYZH-ffn0aG4z_2NrjNDaW824DFzdmKRyLQGzhz6cJs0EHaVDzoDTUHh-4omm7zQZx4xNwNanrHUNgMPTjyjRSGyRp5GenDYy5do-F7lam5EkkhrGkuziPdYFFrjHBGA3rQUKDHFA',
    segments: [
      {
        id: 'seg-upper-cabinets',
        name: 'Upper Wall Cabinets',
        defaultMaterialSku: 'SPW-01',
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
        defaultMaterialSku: 'RM001',
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
        defaultMaterialSku: 'SPW-14',
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
        defaultMaterialSku: 'PZ330',
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
    id: 'bathroom-luxury',
    title: 'Minimalist Ensuite Vanity',
    type: 'bathroom',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
    aspectRatio: 16 / 9,
    beforeImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80',
    segments: [
      {
        id: 'seg-vanity-cabinet',
        name: 'Floating Vanity Body',
        defaultMaterialSku: 'SPW-22',
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
        defaultMaterialSku: 'RM001',
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
  },
  {
    id: 'office-executive',
    title: 'Executive Studio Desk & Credenza',
    type: 'office',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=500&q=80',
    aspectRatio: 16 / 9,
    beforeImageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
    segments: [
      {
        id: 'seg-desk-top',
        name: 'Executive Desktop Surface',
        defaultMaterialSku: 'SPW-08',
        boundingBox: { x: 0.20, y: 0.60, width: 0.60, height: 0.25 },
        renderParameters: {
          grainDirection: 90,
          roughness: 65,
          reflectivity: 35,
          textureScale: 1.1,
          ambientLight: 85
        }
      },
      {
        id: 'seg-back-credenza',
        name: 'Rear Modular Storage',
        defaultMaterialSku: 'CF800',
        boundingBox: { x: 0.15, y: 0.25, width: 0.70, height: 0.35 },
        renderParameters: {
          grainDirection: 0,
          roughness: 45,
          reflectivity: 62,
          textureScale: 1.5,
          ambientLight: 80
        }
      }
    ]
  }
];

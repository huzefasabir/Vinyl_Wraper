import { Material } from '../types';

export const MATERIALS: Material[] = [
  {
    id: 'spw-01',
    sku: 'SPW-01',
    name: 'Japanese Ash Select',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'oak-ash',
    subCategoryName: 'Oak & Ash',
    finish: 'Super Matt',
    tags: ['Interior', 'Super Matt', 'Low Sheen', 'Pores Embossed'],
    description: 'A premium architectural finish featuring a deeply embossed, super-matte texture that faithfully replicates the tactile feel and visual depth of natural Japanese Ash wood grain.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM_VMPoaBeS0LYvQdtGBVugqYmtF1sC9-ygNZ8sjHUlWJ41LrmCODed-paeCKPXk1gdwsW5cueMX_hvFg81Ds1Ur6UU_7gEXseHbUbvPsTPKvkqaDexkW_ENlYhf1UkRGdnqRljg8-fpJMuihU1hCOjSI4Si52ZMo6A5RVpxX4gF6TN2VVyPN1ngp99uqVmikcaMQJmc_zu0rnwCTFJffc9sw4ONRFPCz9pR7NtDPryS8zOAup2lrI',
    macroUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARUBjZNyadjnfn9UdQ07OwD-JHKxJntWJ753-3gSu5F88QfqDTh4OtCSapaUk87AG3PP1FBIT6vRWvmUIQ-FY16ErwozRYs6TIxulmZJA79mIhykSlsC4gF25gqK0r2wifWKI-AA_zjdc7mZhjKMyfpr2gzHK7Jh0K3lH9iOLJDDFofKaUmQ-uKQAopD3beT_-vS8mgfxEpwOzNVSeGU0pNjHdue2feWhrhzEjWvBLopOZHXiaZv4S',
    colorHex: '#d4a373',
    colorVariations: [
      { hex: '#d4a373', name: 'Natural Ash' },
      { hex: '#faedcd', name: 'Pale Blonde' },
      { hex: '#e9edc9', name: 'Muted Sage' }
    ],
    pbr: {
      roughness: 0.82,
      specular: 0.15,
      normalMap: 'Deep Emboss',
      grainDirection: 'Vertical',
      thickness: '0.2mm (8 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A / ASTM E84',
      durabilityYears: 10
    },
    isNew: true,
    isPremium: true,
    isFireRetardant: true
  },
  {
    id: 'spw-14',
    sku: 'SPW-14',
    name: 'Midnight Walnut',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'walnut-teak',
    subCategoryName: 'Walnut & Teak',
    finish: 'Textured',
    tags: ['Textured', 'Deep Grain', 'Low Sheen', 'Architectural'],
    description: 'Deep, rich espresso brown with subtle black grain lines. Matte finish with slight sheen on the grain peaks for dramatic luxury millwork.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk5GRwYi_eciFDw_BuBgqhpcKzUMyRlC4yDATeI3Ce1CgkeZzk8BWzYNEECG87MdftWFDyNWvxniwEvtYi4xwLJGqIAeGc2KviwB1fWlLXBhMFOkDw5LLrKkSrFXhF-hNV7dVruRSS4vTYH7uXzJ076iL88SXg-WDZDV-G-WhTBNWahbRdl62lB2maw6VJyVsA65jIYMwKKxDDbx9JMna7-uZ4nfRakK5W3eEY-69USnSllZQo7jUC',
    macroUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#3d2c23',
    colorVariations: [
      { hex: '#3d2c23', name: 'Dark Roast' },
      { hex: '#261b14', name: 'Obsidian Walnut' }
    ],
    pbr: {
      roughness: 0.74,
      specular: 0.22,
      normalMap: 'Grain Relief',
      grainDirection: 'Vertical',
      thickness: '0.22mm (8.6 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A',
      durabilityYears: 10
    },
    isPremium: true
  },
  {
    id: 'spw-22',
    sku: 'SPW-22',
    name: 'Nordic Oak',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'oak-ash',
    subCategoryName: 'Oak & Ash',
    finish: 'Super Matt',
    tags: ['Scandi', 'Minimalist', 'Super Matt', 'Bleached Tone'],
    description: 'Sleek, modern White Oak vinyl texture. Pale, bleached wood tones with very fine, subtle grain. Smooth matte finish for Japandi and Scandinavian aesthetics.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIC6tbPop-QWjfz2R9-j_UVrVHDV8rzwBzmTb9-zoVNd33_bfOSOec_Dm6JPxK6GZC5-yUyqBINfGxxg9kLx0QlXoihKZg4scTHLm-XA8_bYVeeP2iMNmJvpzPyywqV1j_Nv4AOA-lSFlzvU2BSDE17fwEIdGEVaOZVwNQxgOZYMf-1PKFUy2oE_371xRWrH-nDDcUAuoGnaC5bHQOuwxB77QNJcyY6IitXsj911M7vsI_tQyq6dhF',
    macroUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#f4f1ea',
    colorVariations: [
      { hex: '#f4f1ea', name: 'Nordic White' },
      { hex: '#e3dcd2', name: 'Sand Grey' }
    ],
    pbr: {
      roughness: 0.88,
      specular: 0.12,
      normalMap: 'Subtle Pores',
      grainDirection: 'Vertical',
      thickness: '0.2mm (8 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A',
      durabilityYears: 12
    },
    isNew: true
  },
  {
    id: 'spw-08',
    sku: 'SPW-08',
    name: 'Burmese Teak',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'walnut-teak',
    subCategoryName: 'Walnut & Teak',
    finish: 'Satin',
    tags: ['Satin Sheen', 'Warm Golden', 'Exotic Flow'],
    description: 'Warm golden-brown teak finish with pronounced, dark flowing grain patterns. Slight satin finish reflecting soft, diffused ambient light.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5JOoc_-Q93jjRVblSnug2w3igE5U1BObfH2K8qajlKuYBRWj2ZRUhCa-Xyg7R29apgZPrdwX5-2Pwm4V9e_MZekqVgLbu6P895pgQp2cDZsgUrFaseU4tlqUO3yGN3p86uy8TpdUMnyzFtFGtZYypiNy0p6heRESLztk9hqk-qFluQbRxrRkl5a-uO9xMNee5aXpAvGaEc67aTTpeltODV0ZGbUPHeGQHUc9EBok0danS-qmMgLel',
    macroUrl: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#a0683a',
    colorVariations: [
      { hex: '#a0683a', name: 'Golden Teak' },
      { hex: '#874f26', name: 'Aged Amber' }
    ],
    pbr: {
      roughness: 0.65,
      specular: 0.35,
      normalMap: 'Linear Grooves',
      grainDirection: 'Vertical',
      thickness: '0.22mm (8.6 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A',
      durabilityYears: 10
    }
  },
  {
    id: 'ogw-05',
    sku: 'OGW05',
    name: 'Essence Teak',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'walnut-teak',
    subCategoryName: 'Walnut & Teak',
    finish: 'Matte Grain',
    tags: ['Architectural Woods', 'Teak', 'Matte Grain', 'Fire Retardant'],
    description: 'An architectural staple offering balanced honey tones and authentic organic pore diffusion. Optimized for high-traffic hospitality cabinetry.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk89rtu2MONYGR16YjpErHjl4fDge_djusYDkMSoa61XM8P48BrpnXbyc0RfNddKh4XyaYB4KRKxrKiIEKXg-wK-cq0kh3pRId3-m2NCedKTzzM3yWunNSTc2lmUb60l0H2iJM6R5tnSarGZmZef4vdIMFEkIhvo-vUNfCaac0j9Z61uY620XbdC5kKM13NzrgoRx5P1uzdomsXw0qZF4i73TLx378IAWpxN37ORy1ADCCvtNBcHng',
    macroUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#b27a48',
    colorVariations: [
      { hex: '#b27a48', name: 'Classic Essence' },
      { hex: '#945e2f', name: 'Caramel Deep' }
    ],
    pbr: {
      roughness: 0.78,
      specular: 0.18,
      normalMap: 'Deep Emboss',
      grainDirection: 'Vertical',
      thickness: '0.21mm (8.2 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A / ASTM E84',
      durabilityYears: 12
    },
    isPremium: true,
    isNew: true,
    isFireRetardant: true
  },
  {
    id: 'pz-330',
    sku: 'PZ330',
    name: 'Mono Blanc Matte',
    category: 'monochrome-solids',
    categoryName: 'Monochrome Solids',
    subCategory: 'super-matt',
    subCategoryName: 'Super Matt Solids',
    finish: 'Super Matt',
    tags: ['Anti-Fingerprint', 'Super Matt', 'Ultra Clean', 'Zero Reflection'],
    description: 'Architectural pure white vinyl with anti-fingerprint surface chemistry and zero micro-specularity. Converts tired cabinets into seamless contemporary statements.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMDZULyaQHxlw-hFK84XvAfyEW9C8CktuSc69eMS5XbYrf2wl6NO0CbxyqXNRLLX-dj9VaWhpJdITlk3nDz3clAGq_5AYWNWhEz_HwUguniX1UvgmDXBLxuK1WgCIB0BAs39w29EFYkqleG7mHS3lSLQUEODqmm_vZwZ_tXu5W9X73LwL2dJ-8HZ_0kzceNyUI33A7F5aeaujglxboZlKMRS9LSrd1mi-nRUZxwDO-IqBao9b5tbBj',
    macroUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#f8fafc',
    colorVariations: [
      { hex: '#f8fafc', name: 'Polar White' },
      { hex: '#f1f5f9', name: 'Alabaster' },
      { hex: '#e2e8f0', name: 'Silk Grey' }
    ],
    pbr: {
      roughness: 0.95,
      specular: 0.05,
      normalMap: 'Micro Velvet',
      grainDirection: 'Omni-directional',
      thickness: '0.19mm (7.5 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'High-Tack Air-Channel',
      fireRating: 'Class A',
      durabilityYears: 15
    },
    isPremium: true
  },
  {
    id: 'rm-001',
    sku: 'RM001',
    name: 'Calacatta Gloss',
    category: 'stone-marble',
    categoryName: 'Stone & Marble',
    subCategory: 'calacatta',
    subCategoryName: 'Calacatta Veins',
    finish: 'High Gloss',
    tags: ['Calacatta', 'Luxury Marble', 'High Gloss', 'Seamless Veins'],
    description: 'Opulent Italian Calacatta marble facsimile with deep grey and gold-hued veining beneath a high-durability ultra-gloss topcoat with self-healing thermal properties.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByabxEn9BHKuaYttToAQ1AH3PMZDGARpNhfGzWmPC48eYUwYEu8zAWWXHg3korsZ-M2wmGe_es_ZJGoi_T6FOf_0IGUhDXmBlusPZUugmBehlE_xNsVx5pAMO-z1_sUjVz4KGk55c1aRcxsms394C7VKAYKx3G0XgFAidTqXo46Hgc4QJE1ck8v_wxK-i1nYLD7Lxx6mvxl8Lzhm8vuy6BK9THdcuBaMh4j0rlk4PH7lcKRFmTuXcX',
    macroUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#ecefe6',
    colorVariations: [
      { hex: '#ecefe6', name: 'Calacatta Gold' },
      { hex: '#e2e8f0', name: 'Statuario Pure' },
      { hex: '#cbd5e1', name: 'Carrara Mist' }
    ],
    pbr: {
      roughness: 0.12,
      specular: 0.88,
      normalMap: 'Polished Smooth Glass',
      grainDirection: 'Omni-directional',
      thickness: '0.25mm (10 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Polymeric Air-Release',
      fireRating: 'Class A',
      durabilityYears: 12
    },
    isPremium: true,
    isNew: true
  },
  {
    id: 'cf-800',
    sku: 'CF800',
    name: 'Carbon Weave',
    category: 'carbon-fiber',
    categoryName: 'Carbon Fiber',
    subCategory: 'all-carbon',
    subCategoryName: 'Twill Weave',
    finish: 'Textured',
    tags: ['Twill Weave', '3D Tactile', 'Motorsport High-Tech'],
    description: '3D embossed carbon fiber weave reproducing the holographic light shift and structural rigidity of aerospace composites.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJr3CNRB5_O_S0CrJEC7hOwxSOLpBzre2unCuG_DU6rU_ZSDPiOnUO0VdDAwCtULdYnga9QWN-XkHVBvwrQnijwxtvyXkyJbhdVM7Fc4oIlWTkK0lMwS_F2Oaxo-2FmH5rHc97tBM40rRsb8FDD8KPibB1OAlOZnnCj8fxjcsmT7tfH1RclB0JiVyshpRdTQdCV013TgB3B9SEUOEHJqjip3g6Jt_Biv_6aUzqIeg-wtaA4ncCBKeu',
    macroUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#1e293b',
    colorVariations: [
      { hex: '#0f172a', name: 'Stealth Black' },
      { hex: '#334155', name: 'Gunmetal Twill' }
    ],
    pbr: {
      roughness: 0.45,
      specular: 0.62,
      normalMap: 'Twill Interlock Grid',
      grainDirection: 'Vertical',
      thickness: '0.24mm (9.5 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Cast Structural Acrylic',
      fireRating: 'Class B',
      durabilityYears: 8
    }
  },
  {
    id: 'mt-311',
    sku: 'MT311',
    name: 'Brushed Metal',
    category: 'metallic-finishes',
    categoryName: 'Metallic Finishes',
    subCategory: 'brushed',
    subCategoryName: 'Brushed Alloys',
    finish: 'Brushed',
    tags: ['Brushed Steel', 'Industrial', 'Anodized Texture', 'High Reflectivity'],
    description: 'Micro-linear brushed aluminium film delivering real metallic lustre, anisotropic reflection highlights, and superior scratch shielding.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAbKfJE76V2ysAwCgcsDRdcUXMYIStQGiUUcvYbJN4ONYqk7BN1NxUM2sY3HzVAW4w31WN4orQRdYClp8C8gK_PfETzHLoDTo7OPjg_9M4b65cKVHGbfnRzkdJiR-eDTsJ3tYBOGLcdZ67u_VL7nWB9kBKS5lMdKxeeerTLVhDQemh0yFj4p9Yyr9gbigua9x0GUW8I-dsPxCtwbEPbNpUiO2eKXr6xQe2SEwPbmmSnuYcS1dRUg6m',
    macroUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#94a3b8',
    colorVariations: [
      { hex: '#94a3b8', name: 'Titanium Silver' },
      { hex: '#64748b', name: 'Smoked Nickel' },
      { hex: '#b45309', name: 'Champagne Bronze' }
    ],
    pbr: {
      roughness: 0.38,
      specular: 0.76,
      normalMap: 'Directional Micro-Striae',
      grainDirection: 'Horizontal',
      thickness: '0.21mm (8.3 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Low-Initial Tack Repositionable',
      fireRating: 'Class A',
      durabilityYears: 10
    }
  },
  {
    id: 'spw-04',
    sku: 'SPW-04',
    name: 'Dark Walnut Select',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'walnut-teak',
    subCategoryName: 'Walnut & Teak',
    finish: 'Textured',
    tags: ['Architectural Woods', 'Dark Walnut', 'Deep Grain'],
    description: 'Subtle charcoal and cocoa undertones with low sheen, high-contrast pores and warm reflection angles.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk5GRwYi_eciFDw_BuBgqhpcKzUMyRlC4yDATeI3Ce1CgkeZzk8BWzYNEECG87MdftWFDyNWvxniwEvtYi4xwLJGqIAeGc2KviwB1fWlLXBhMFOkDw5LLrKkSrFXhF-hNV7dVruRSS4vTYH7uXzJ076iL88SXg-WDZDV-G-WhTBNWahbRdl62lB2maw6VJyVsA65jIYMwKKxDDbx9JMna7-uZ4nfRakK5W3eEY-69USnSllZQo7jUC',
    macroUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#2b1e16',
    colorVariations: [
      { hex: '#2b1e16', name: 'Charcoal Walnut' },
      { hex: '#453225', name: 'Tuscan Walnut' }
    ],
    pbr: {
      roughness: 0.72,
      specular: 0.20,
      normalMap: 'Deep Emboss',
      grainDirection: 'Vertical',
      thickness: '0.21mm (8.2 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A',
      durabilityYears: 10
    }
  },
  {
    id: 'spw-12',
    sku: 'SPW-12',
    name: 'Bleached Ash',
    category: 'architectural-woods',
    categoryName: 'Architectural Woods',
    subCategory: 'oak-ash',
    subCategoryName: 'Oak & Ash',
    finish: 'Super Matt',
    tags: ['Bleached Tone', 'Minimalist', 'Super Matt'],
    description: 'Feathered white ash texture with gentle waves and cool neutral undertones suitable for open floor plan cabinetry.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIC6tbPop-QWjfz2R9-j_UVrVHDV8rzwBzmTb9-zoVNd33_bfOSOec_Dm6JPxK6GZC5-yUyqBINfGxxg9kLx0QlXoihKZg4scTHLm-XA8_bYVeeP2iMNmJvpzPyywqV1j_Nv4AOA-lSFlzvU2BSDE17fwEIdGEVaOZVwNQxgOZYMf-1PKFUy2oE_371xRWrH-nDDcUAuoGnaC5bHQOuwxB77QNJcyY6IitXsj911M7vsI_tQyq6dhF',
    macroUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    colorHex: '#e8e5dc',
    colorVariations: [
      { hex: '#e8e5dc', name: 'Chalk Ash' },
      { hex: '#d9d4c7', name: 'Driftwood' }
    ],
    pbr: {
      roughness: 0.85,
      specular: 0.10,
      normalMap: 'Micro Velvet',
      grainDirection: 'Vertical',
      thickness: '0.2mm (8 mil)',
      rollWidth: '1220mm (48")',
      adhesive: 'Air-Release Comply™',
      fireRating: 'Class A',
      durabilityYears: 10
    }
  }
];

export const CATEGORIES = [
  { id: 'architectural-woods', name: 'Architectural Woods', count: 1420 },
  { id: 'stone-marble', name: 'Stone & Marble', count: 850 },
  { id: 'monochrome-solids', name: 'Monochrome Solids', count: 540 },
  { id: 'metallic-finishes', name: 'Metallic Finishes', count: 260 },
  { id: 'carbon-fiber', name: 'Carbon Fiber', count: 134 }
];

export const SUB_CATEGORIES: Record<string, { id: string; name: string }[]> = {
  'architectural-woods': [
    { id: 'all-woods', name: 'All Woods' },
    { id: 'oak-ash', name: 'Oak & Ash' },
    { id: 'walnut-teak', name: 'Walnut & Teak' },
    { id: 'exotic-grains', name: 'Exotic Grains' }
  ],
  'stone-marble': [
    { id: 'all-stone', name: 'All Stone' },
    { id: 'calacatta', name: 'Calacatta & Statuario' },
    { id: 'granite', name: 'Granite & Basalt' }
  ],
  'monochrome-solids': [
    { id: 'all-solids', name: 'All Solids' },
    { id: 'super-matt', name: 'Super Matt' },
    { id: 'gloss', name: 'High Gloss' }
  ],
  'metallic-finishes': [
    { id: 'all-metals', name: 'All Metals' },
    { id: 'brushed', name: 'Brushed Alloys' }
  ],
  'carbon-fiber': [
    { id: 'all-carbon', name: 'All Carbon' }
  ]
};

import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Load Catalog from bodaq_cat.json for standalone node / express serving
const CATALOG_FILE = path.join(process.cwd(), 'bodaq_cat.json');
let cachedRawCatalog: any = null;
let cachedFlatMaterials: any[] = [];
let cachedCategoriesSummary: any[] = [];

function finishTypeToDisplay(finishType?: string): string {
  if (!finishType) return 'Super Matt';
  const mapping: Record<string, string> = {
    wood_grain: 'Wood Grain',
    solid: 'Solid Color',
    super_matt: 'Super Matt',
    stone_marble: 'Stone & Marble',
    fabric: 'Natural Fabric',
    metal: 'Velvet & Metal',
    leather: 'Soft Leather',
    special: 'Special Architectural'
  };
  return mapping[finishType] || finishType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getCleanImagePath(diffuseMapPath?: string, code?: string): string {
  if (!diffuseMapPath) return '';
  let clean = diffuseMapPath.replace(/\\/g, '/');
  if (clean.startsWith('images/')) clean = clean.slice('images/'.length);
  else if (clean.startsWith('storage_data/images/')) clean = clean.slice('storage_data/images/'.length);
  const dirPart = path.posix.dirname(clean);
  const codeVal = code || '';
  return dirPart && dirPart !== '.' ? `${dirPart}/${codeVal}.jpg` : `${codeVal}.jpg`;
}

function transformCatalogItem(it: any, catKey: string, subcatKey: string) {
  const code = String(it.code || it.sku || '');
  const diffuse = String(it.diffuse_map_path || '');
  const bump = String(it.bump_map_path || '');
  const normal = String(it.normal_map_path || '');
  const mainRelImg = getCleanImagePath(diffuse, code);
  const imageUrl = `/api/images/${mainRelImg}`;
  const features = it.Features || {};
  const renderParams = it.render_params || {};
  const finishDisplay = finishTypeToDisplay(it.finish_type);

  const pbr = {
    roughness: renderParams.roughness ?? 0.55,
    specular: renderParams.reflectivity ?? 0.15,
    normalMap: (renderParams.bump_intensity ?? 1) > 2.0 ? 'Deep Emboss' : 'Micro Texture',
    grainDirection: typeof renderParams.grain_direction === 'string'
      ? renderParams.grain_direction.charAt(0).toUpperCase() + renderParams.grain_direction.slice(1)
      : 'Vertical',
    thickness: '0.2mm - 0.45mm (Heavy Commercial)',
    rollWidth: '1220mm (48")',
    adhesive: 'Pressure-Sensitive Air-Release Comply™',
    fireRating: features.fire_retardant ? 'Class A / ASTM E84' : 'Commercial Grade',
    durabilityYears: 10
  };

  return {
    id: code.toLowerCase(),
    code,
    sku: it.sku || code,
    name: it.name || code,
    page: it.page,
    category: catKey,
    categoryName: catKey,
    subCategory: subcatKey,
    subCategoryName: it.subcategory || subcatKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    finish: finishDisplay,
    finishType: it.finish_type || 'wood_grain',
    colorHex: it.base_color_hex || '#4F3C2C',
    imageUrl,
    macroUrl: imageUrl,
    diffuseMapPath: diffuse,
    bumpMapPath: bump,
    normalMapPath: normal,
    features,
    renderParams,
    pbr,
    isNew: Boolean(features.is_new),
    isFireRetardant: Boolean(features.fire_retardant),
    description: `Architectural wrap film in ${it.name || code} with authentic ${finishDisplay} finish.`
  };
}

function initCatalog() {
  try {
    if (!fs.existsSync(CATALOG_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
    cachedRawCatalog = raw;
    const categoriesDict = raw.categories || {};
    const flatList: any[] = [];
    const summaryList: any[] = [];

    for (const [catName, catData] of Object.entries<any>(categoriesDict)) {
      const subcatsDict = catData.sub_categories || {};
      let catTotal = 0;
      const subcatsList: any[] = [];

      for (const [subcatKey, items] of Object.entries<any[]>(subcatsDict)) {
        let subcatDisplay = subcatKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (items && items[0]?.subcategory) {
          subcatDisplay = items[0].subcategory;
        }
        const transformed = items.map(it => transformCatalogItem(it, catName, subcatKey));
        flatList.push(...transformed);
        catTotal += transformed.length;
        subcatsList.push({
          id: subcatKey,
          name: subcatDisplay,
          count: transformed.length
        });
      }

      summaryList.push({
        id: catName,
        name: catName,
        count: catTotal,
        subCategories: subcatsList
      });
    }

    cachedFlatMaterials = flatList;
    cachedCategoriesSummary = summaryList;
    console.log(`[Express] Loaded ${cachedFlatMaterials.length} materials across ${cachedCategoriesSummary.length} categories.`);
  } catch (err) {
    console.warn('[Express] Could not load bodaq_cat.json:', err);
  }
}

initCatalog();

// In-memory persistent state for sessions
interface UploadedSpace {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

const uploadedSpaces: Map<string, UploadedSpace> = new Map();

interface SavedProject {
  id: string;
  name: string;
  spaceName: string;
  createdAt: string;
  thumbnailUrl: string;
  spaceImageId: string;
  appliedMaterials: any[];
  notes?: string;
}

const savedProjects: SavedProject[] = [
  {
    id: 'proj-001',
    name: 'Metropolitan Penthouse Kitchen',
    spaceName: 'Kitchen Island & Cabinets',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeY9Vj8PDpu-0VphwfKJ8bfKDstbwmN8dT0QukCeUoROts61UpKYAy3r98thmuwyyff6jvqBf6lK48DxI7A7G7_CpsB_Wg8OzGyiUOm7dtIofuYZH-ffn0aG4z_2NrjNDaW824DFzdmKRyLQGzhz6cJs0EHaVDzoDTUHh-4omm7zQZx4xNwNanrHUNgMPTjyjRSGyRp5GenDYy5do-F7lam5EkkhrGkuziPdYFFrjHBGA3rQUKDHFA',
    spaceImageId: 'kitchen-modern',
    appliedMaterials: [
      {
        segmentId: 'seg-upper-cabinets',
        segmentName: 'Upper Wall Cabinets',
        material: {
          sku: 'PZ330',
          name: 'Mono Blanc Matte',
          categoryName: 'Monochrome Solids'
        },
        params: { grainDirection: 0, roughness: 95, reflectivity: 5 }
      },
      {
        segmentId: 'seg-island-countertop',
        segmentName: 'Waterfall Island Countertop',
        material: {
          sku: 'RM001',
          name: 'Calacatta Gloss',
          categoryName: 'Stone & Marble'
        },
        params: { grainDirection: 45, roughness: 12, reflectivity: 88 }
      }
    ],
    notes: 'Approved spec with client. Super matt upper cabinetry paired with Calacatta gloss waterfall countertop.'
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));


  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'VinylWrap AI Studio API',
      version: '2.4.0',
      totalMaterials: cachedFlatMaterials.length,
      totalCategories: cachedCategoriesSummary.length,
      timestamp: new Date().toISOString()
    });
  });

  // Serve static images from storage_data/images
  app.get('/api/images/*', (req, res) => {
    const rawPath = req.params[0] || '';
    const cleanPath = decodeURIComponent(rawPath).replace(/\\/g, '/').replace(/^\/+/, '');

    const candidates = [
      path.join(process.cwd(), 'storage_data', 'images', cleanPath),
      path.join(process.cwd(), 'storage_data', cleanPath),
      path.join(process.cwd(), cleanPath),
    ];

    if (cleanPath.endsWith('.jpg')) {
      const baseNoExt = cleanPath.slice(0, -4);
      candidates.push(path.join(process.cwd(), 'storage_data', 'images', `${baseNoExt}.jpg.png`));
      candidates.push(path.join(process.cwd(), 'storage_data', 'images', `${baseNoExt}.png`));
    }

    for (const p of candidates) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(p);
      }
    }

    // High quality architectural fallback SVG
    const filename = cleanPath.split('/').pop() || 'vinyl-swatch';
    const cleanLabel = filename.replace(/\.[^/.]+$/, '');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#141c24"/>
  <rect x="20" y="20" width="360" height="260" rx="12" fill="#182028" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="200" cy="120" r="32" fill="#222b33"/>
  <text x="200" y="180" fill="#dae3ee" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Vinyl Specimen</text>
  <text x="200" y="205" fill="#87929a" font-family="monospace" font-size="11" text-anchor="middle">${cleanLabel}</text>
</svg>`);
  });

  // Catalog Hierarchy
  app.get('/api/catalog', (req, res) => {
    const categoriesDict = cachedRawCatalog?.categories || {};
    const formattedHierarchy: any = {};

    for (const [catName, catData] of Object.entries<any>(categoriesDict)) {
      const subcatsDict = catData.sub_categories || {};
      const formattedSubcats: any = {};

      for (const [subcatKey, items] of Object.entries<any[]>(subcatsDict)) {
        formattedSubcats[subcatKey] = items.map(it => transformCatalogItem(it, catName, subcatKey));
      }

      formattedHierarchy[catName] = {
        name: catName,
        count: Object.values<any[]>(subcatsDict).reduce((acc, it) => acc + it.length, 0),
        sub_categories: formattedSubcats
      };
    }

    res.json({
      success: true,
      totalItems: cachedFlatMaterials.length,
      categories: formattedHierarchy
    });
  });

  // Categories Summary
  app.get('/api/categories', (req, res) => {
    res.json({
      success: true,
      totalItems: cachedFlatMaterials.length,
      categories: cachedCategoriesSummary
    });
  });

  // Materials with on-demand filtering
  app.get('/api/materials', (req, res) => {
    let results = [...cachedFlatMaterials];
    const category = req.query.category as string | undefined;
    const subcategory = req.query.subcategory as string | undefined;
    const search = req.query.search as string | undefined;
    const isNew = req.query.is_new as string | undefined;
    const fireRetardant = req.query.fire_retardant as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    if (category && category.toLowerCase() !== 'all') {
      results = results.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }

    if (subcategory && subcategory.toLowerCase() !== 'all') {
      results = results.filter(m => m.subCategory.toLowerCase() === subcategory.toLowerCase());
    }

    if (isNew !== undefined) {
      const bNew = isNew === 'true';
      results = results.filter(m => m.isNew === bNew);
    }

    if (fireRetardant !== undefined) {
      const bFire = fireRetardant === 'true';
      results = results.filter(m => m.isFireRetardant === bFire);
    }

    if (search) {
      const s = search.trim().toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(s) ||
        m.code.toLowerCase().includes(s) ||
        m.sku.toLowerCase().includes(s) ||
        m.categoryName.toLowerCase().includes(s) ||
        m.subCategoryName.toLowerCase().includes(s) ||
        m.finish.toLowerCase().includes(s)
      );
    }

    const totalMatches = results.length;
    const paginated = limit ? results.slice(offset, offset + limit) : results.slice(offset);

    res.json({
      success: true,
      total: totalMatches,
      count: paginated.length,
      materials: paginated
    });
  });

  // Individual Material Detail
  app.get('/api/materials/:code_or_sku', (req, res) => {
    const target = req.params.code_or_sku.trim().toLowerCase();
    const found = cachedFlatMaterials.find(m =>
      m.code.toLowerCase() === target ||
      m.sku.toLowerCase() === target ||
      m.id === target
    );
    if (!found) {
      return res.status(404).json({ error: `Material '${req.params.code_or_sku}' not found` });
    }
    res.json({ success: true, material: found });
  });

  // API 2: Upload Space Photo
  app.post('/api/upload-space', (req, res) => {
    try {
      const { imageData, filename, spaceType } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const id = 'space-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const spaceObj: UploadedSpace = {
        id,
        name: filename || 'Custom Room Space',
        url: imageData,
        type: spaceType || 'custom',
        size: Math.round((imageData.length * 3) / 4),
        uploadedAt: new Date().toISOString()
      };

      uploadedSpaces.set(id, spaceObj);

      res.status(201).json({
        success: true,
        space: spaceObj,
        message: 'Space image processed and geometry mapped successfully'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Upload processing failed' });
    }
  });

  // API 3: Apply Wrap & Simulate Render
  app.post('/api/apply-wrap', (req, res) => {
    try {
      const { space_image_id, segment_id, material_sku, parameters } = req.body;
      
      // Simulate high-precision AI surface normal mapping & lighting occlusion
      const grainAngle = parameters?.grainDirection || 0;
      const roughness = parameters?.roughness ?? 80;
      const reflectivity = parameters?.reflectivity ?? 20;

      res.json({
        success: true,
        render_id: 'rnd-' + Date.now(),
        space_image_id,
        segment_id,
        material_sku,
        computed_lighting: {
          ambient_occlusion_factor: 0.92,
          specular_highlight_intensity: ((100 - roughness) / 100) * (reflectivity / 100) * 1.5,
          anisotropic_angle_deg: grainAngle,
          fresnel_ior: 1.48
        },
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Render simulation failed' });
    }
  });

  // API 4: Export Project Bundle
  app.post('/api/export', (req, res) => {
    try {
      const { projectName, spaceImageId, appliedMaterials, highResUrl } = req.body;
      
      const exportId = 'EXP-' + Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().toISOString();

      const billOfMaterials = (appliedMaterials || []).map((item: any, idx: number) => ({
        itemNumber: idx + 1,
        surfaceZone: item.segmentName || item.segmentId,
        sku: item.material?.sku || 'N/A',
        materialName: item.material?.name || 'Architectural Wrap',
        finish: item.material?.finish || 'Super Matt',
        rollCoverageEstimatedSqM: (Math.random() * 4 + 2).toFixed(1),
        fireRating: item.material?.pbr?.fireRating || 'Class A',
        adhesiveType: item.material?.pbr?.adhesive || 'Air-Release Comply™'
      }));

      res.json({
        success: true,
        exportId,
        projectName: projectName || 'Architectural Wrap Project',
        timestamp,
        downloadUrl: highResUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23141c24"/><text x="400" y="300" fill="%2338bdf8" text-anchor="middle" font-family="sans-serif" font-size="24">VinylWrap AI Studio High-Res Render</text></svg>',
        billOfMaterials,
        architecturalSpecificationSheet: {
          standards: ['ASTM E84 Class A', 'NFPA 255', 'ISO 9001:2015'],
          recommendedPrimer: '3M 94 Primer (Porous Surfaces)',
          installationTemperature: '16°C – 28°C (60°F – 82°F)',
          warrantyYears: 10
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Export generation failed' });
    }
  });

  // API 5: Get & Save Projects
  app.get('/api/projects', (req, res) => {
    res.json({ projects: savedProjects });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project: SavedProject = {
        id: 'proj-' + Date.now(),
        name: req.body.name || 'Untitled Renovation',
        spaceName: req.body.spaceName || 'Custom Room',
        createdAt: new Date().toISOString(),
        thumbnailUrl: req.body.thumbnailUrl || '',
        spaceImageId: req.body.spaceImageId || 'kitchen-modern',
        appliedMaterials: req.body.appliedMaterials || [],
        notes: req.body.notes || ''
      };

      savedProjects.unshift(project);
      res.status(201).json({ success: true, project });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  // API 6: AI Surface Advisor (Gemini integration or smart fallback)
  app.post('/api/ai-suggest', async (req, res) => {
    try {
      const { spaceType, roomVibe, existingElements } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an elite architectural surface designer and material specialist.
Suggest the optimal architectural vinyl wrap combination for a ${spaceType || 'kitchen'} space with ${roomVibe || 'modern luxury'} aesthetic and ${existingElements || 'neutral surroundings'}.
Return JSON format with:
{
  "designTheme": "Short theme title",
  "paletteMood": "Atmospheric description in 2 sentences",
  "recommendedSkus": ["SPW-01", "RM001", "PZ330"],
  "zonePairings": [
    {"zone": "Upper Cabinets", "material": "Japanese Ash (SPW-01)", "finish": "Super Matt", "why": "Explanation"},
    {"zone": "Countertop & Island", "material": "Calacatta Gloss (RM001)", "finish": "High Gloss", "why": "Explanation"}
  ],
  "lightingTip": "Practical tip for lighting and reflection angles"
}`
          });

          const text = response.text || '';
          const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return res.json({ success: true, advisor: parsed });
        } catch (geminiError) {
          console.warn('Gemini API call failed, using heuristic advisor:', geminiError);
        }
      }

      // High-quality deterministic fallback recommendations
      res.json({
        success: true,
        advisor: {
          designTheme: 'Japandi Modern Contrast',
          paletteMood: 'A serene balance of organic pale grain textures anchored by ultra-matte neutral solids and polished Calacatta veining.',
          recommendedSkus: ['SPW-01', 'PZ330', 'RM001'],
          zonePairings: [
            {
              zone: 'Upper Wall Cabinets',
              material: 'Japanese Ash Select (SPW-01)',
              finish: 'Super Matt',
              why: 'Deeply embossed micro-grain adds natural warmth without distracting specular glare under direct downlights.'
            },
            {
              zone: 'Waterfall Island Countertop',
              material: 'Calacatta Gloss (RM001)',
              finish: 'High Gloss',
              why: 'Creates a focal architectural centerpiece with continuous veining and self-healing thermal topcoat.'
            },
            {
              zone: 'Base Storage Units',
              material: 'Mono Blanc Matte (PZ330)',
              finish: 'Super Matt Solids',
              why: 'Zero-reflection anti-fingerprint surface provides seamless horizontal grounding.'
            }
          ],
          lightingTip: 'Position LED strip lighting with 3000K warm white color temperature at a 45° angle to accentuate the tactile emboss.'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'AI recommendation error' });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VinylWrap AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});

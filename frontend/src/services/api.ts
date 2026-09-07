import { CategorySummary, Material, Project, SpaceSegment } from '../types';

export const RENDER_BACKEND_URL = 'https://vinyl-wraper-1.onrender.com';

// By default, relative '/api' proxies through Node/Vite server to backend to avoid browser CORS issues.
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');



export interface CatalogResponse {
  success: boolean;
  totalItems: number;
  categories: Record<string, {
    name: string;
    count: number;
    sub_categories: Record<string, Material[]>;
  }>;
}

export interface CategoriesResponse {
  success: boolean;
  totalItems: number;
  categories: CategorySummary[];
}

export interface MaterialsResponse {
  success: boolean;
  total: number;
  count: number;
  materials: Material[];
}

export async function fetchCategories(): Promise<CategorySummary[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CategoriesResponse = await res.json();
    return data.categories || [];
  } catch (err) {
    console.warn('Could not fetch categories from backend, using fallback:', err);
    return [];
  }
}

export async function fetchCatalog(): Promise<CatalogResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch catalog from backend, using fallback:', err);
    return null;
  }
}

export async function fetchMaterials(params?: {
  category?: string;
  subcategory?: string;
  search?: string;
  is_new?: boolean;
  fire_retardant?: boolean;
}): Promise<Material[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.subcategory && params.subcategory !== 'all') query.set('subcategory', params.subcategory);
    if (params?.search) query.set('search', params.search);
    if (params?.is_new !== undefined) query.set('is_new', String(params.is_new));
    if (params?.fire_retardant !== undefined) query.set('fire_retardant', String(params.fire_retardant));

    const url = `${API_BASE}/materials${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: MaterialsResponse = await res.json();
    return data.materials || [];
  } catch (err) {
    console.warn('Could not fetch materials from backend, using fallback:', err);
    return [];
  }
}

export async function fetchMaterialBySku(skuOrCode: string): Promise<Material | null> {
  try {
    const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(skuOrCode)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.material || null;
  } catch (err) {
    console.warn(`Could not fetch material ${skuOrCode}:`, err);
    return null;
  }
}

export async function aiSuggest(payload: {
  spaceType?: string;
  roomVibe?: string;
  existingElements?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/ai-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('AI suggest fallback triggered:', err);
    return null;
  }
}

export interface VisionSegmentationResult {
  segments: SpaceSegment[];
  hfSegmentedImage?: string;
  previewImage?: string;
}

export async function segmentSpaceByText(
  imageData: string,
  query: string,
  confidenceThreshold: number = 0.5
): Promise<VisionSegmentationResult> {
  try {
    const res = await fetch(`${API_BASE}/segment-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, query, confidenceThreshold }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      segments: data.segments || [],
      hfSegmentedImage: data.hfSegmentedImage || data.previewImage || imageData,
      previewImage: data.previewImage || data.hfSegmentedImage || imageData
    };
  } catch (err) {
    console.warn('Vision segmentation API error, using geometry fallback:', err);
    const cleanSlug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      segments: [
        {
          id: `seg-${cleanSlug}-1`,
          name: `${query.charAt(0).toUpperCase() + query.slice(1)} #1`,
          confidence: 0.92,
          boundingBox: { x: 0.28, y: 0.22, width: 0.44, height: 0.38 },
          pathCoordinates: [
            { x: 0.28, y: 0.22 },
            { x: 0.72, y: 0.22 },
            { x: 0.72, y: 0.60 },
            { x: 0.28, y: 0.60 }
          ],
          cutoutBase64: imageData,
          areaPercentage: 16.7
        }
      ],
      hfSegmentedImage: imageData,
      previewImage: imageData
    };
  }
}

export async function uploadSpaceImage(imageData: string, filename?: string, spaceType?: string) {
  const res = await fetch(`${API_BASE}/upload-space`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData, filename, spaceType }),
  });
  return await res.json();
}

export async function applyWrapSimulation(payload: {
  space_image_id?: string;
  segment_id?: string;
  material_sku: string;
  parameters?: any;
}) {
  const res = await fetch(`${API_BASE}/apply-wrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function exportProjectBundle(payload: {
  projectName?: string;
  spaceImageId?: string;
  appliedMaterials?: any[];
  highResUrl?: string;
}) {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function fetchProjectsList(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.warn('Fetch projects fallback:', err);
    return [];
  }
}

export async function saveProjectToBackend(project: Partial<Project>) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return await res.json();
}

// ── Async Volka HF Space ──────────────────────────────────────────────────────

export interface VolkaJobResponse {
  success?: boolean;
  job_id: string;
  status: 'pending' | 'done' | 'error';
  hfSegmentedImage?: string;
  description?: string;
  error?: string;
}

async function ensureBase64DataUrl(urlOrBase64: string): Promise<string> {
  if (!urlOrBase64) return '';
  if (urlOrBase64.startsWith('data:')) return urlOrBase64;
  try {
    const res = await fetch(urlOrBase64);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not convert image URL to base64 on client, passing raw:', err);
    return urlOrBase64;
  }
}

/**
 * Fire-and-forget: sends image + prompt to backend which starts an HF Space
 * call in the background. Returns immediately with a job_id.
 */
export async function startVolkaAnalysis(
  imageData: string,
  prompt: string,
  filename = 'room.jpg'
): Promise<VolkaJobResponse> {
  const b64Data = await ensureBase64DataUrl(imageData);
  const res = await fetch(`${API_BASE}/volka-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: b64Data, prompt, filename }),
  });

  if (!res.ok) {
    // Try to parse structured error from the proxy
    let body: any = {};
    try { body = await res.json(); } catch { /* ignore */ }

    if (res.status === 503 || body?.error === 'backend_unavailable') {
      throw new Error(
        body?.message ?? 'Python backend is not running. Start it with: python main.py'
      );
    }
    throw new Error(`HTTP ${res.status}: ${body?.message ?? res.statusText}`);
  }

  return await res.json();
}

export async function pollVolkaStatus(jobId: string): Promise<VolkaJobResponse> {
  const res = await fetch(`${API_BASE}/volka-status/${encodeURIComponent(jobId)}`);

  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch { /* ignore */ }

    if (res.status === 503 || body?.error === 'backend_unavailable') {
      throw new Error(
        body?.message ?? 'Python backend is not running. Start it with: python main.py'
      );
    }
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

// ── Vinyl CV Render Pipeline ──────────────────────────────────────────────────

export interface VinylRenderRequest {
  /** base64 data-URL of the original room photo */
  baseImageData: string;
  /** base64 data-URL of the HF Space segmentation result image */
  maskImageData: string;
  /** Relative server path to the diffuse map e.g. "wood/optical-grain/OGW01_diffuse.jpg" */
  diffuseMapPath?: string;
  /** Fallback: relative server path to the plain swatch e.g. "wood/optical-grain/OGW01.jpg" */
  swatchImagePath?: string;
  /** Relative server path to the bump map e.g. "wood/optical-grain/OGW01_bump.jpg" */
  bumpMapPath?: string;
  /** Relative server path to the normal map e.g. "wood/optical-grain/OGW01_normal.jpg" */
  normalMapPath?: string;
  /** Blend strength 0.0–1.0 (default 1.0) */
  opacity?: number;
  /** PBR render params: grain_direction, scale_factor, roughness, reflectivity, bump_intensity */
  renderParams?: {
    grain_direction?: string;
    scale_factor?: number;
    roughness?: number;
    reflectivity?: number;
    bump_intensity?: number;
  };
}

export interface VinylRenderResponse {
  success: boolean;
  /** base64 PNG data-URL of the composited result */
  compositeImage: string;
  render_stats?: {
    elapsed_ms: number;
    swatch_path: string;
    opacity: number;
  };
  error?: string;
}

/**
 * POST /api/vinyl-render
 * ──────────────────────
 * Sends the room photo, the HF mask image, and the vinyl swatch path to the
 * OpenCV pipeline on the FastAPI backend.  The pipeline:
 *   1. Extracts pure texture from the swatch (removes white card / labels)
 *   2. Tiles it seamlessly across the canvas
 *   3. Modulates with CIELAB luminance from the original (±30% shadow preservation)
 *   4. Alpha-composites onto the original using the HF mask
 *
 * Returns a PNG base64 data-URL ready to display as `space.hfSegmentedImage`.
 */
export async function renderVinylWrap(
  payload: VinylRenderRequest
): Promise<VinylRenderResponse> {
  const res = await fetch(`${API_BASE}/vinyl-render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch { /* ignore */ }

    if (res.status === 503 || body?.error === 'backend_unavailable') {
      throw new Error(
        body?.message ?? 'Python backend is not running. Start it with: python main.py'
      );
    }
    if (res.status === 404) {
      throw new Error(
        body?.detail ?? 'Vinyl swatch file not found on server. Check diffuseMapPath.'
      );
    }
    throw new Error(
      body?.detail ?? `HTTP ${res.status}: vinyl render failed`
    );
  }

  return await res.json();
}

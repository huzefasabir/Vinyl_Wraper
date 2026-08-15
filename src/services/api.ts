import { CategorySummary, Material, Project } from '../types';

const API_BASE = '/api';

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

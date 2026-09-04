/**
 * MasterVinylMaterial
 * ───────────────────
 * LOAD-ONCE / SHARE-EVERYWHERE pattern.
 *
 * 1. Loads diffuse, bump, and normal maps exactly ONCE for the active vinyl.
 * 2. Compiles a single THREE.MeshStandardMaterial with PBR parameters.
 * 3. Publishes the compiled material AND the tile-repeat factor via context so
 *    every <MaskMesh> can reference both without re-downloading anything.
 *
 * Changing the vinyl in the React UI re-renders this provider with new props,
 * which causes useTexture to load the new maps and recompile — all 10 cabinet
 * doors update simultaneously from that single re-render.
 */

import React, { createContext, useContext, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { Material as VinylMaterial } from '../../types';

// ── Context shape ─────────────────────────────────────────────────────────────

interface VinylCtxValue {
  material:   THREE.MeshStandardMaterial | null;
  tileRepeat: number;
}

const VinylMaterialCtx = createContext<VinylCtxValue>({ material: null, tileRepeat: 2 });

export function useVinylMaterial(): THREE.MeshStandardMaterial | null {
  return useContext(VinylMaterialCtx).material;
}

export function useVinylTileRepeat(): number {
  return useContext(VinylMaterialCtx).tileRepeat;
}

// ── URL helper ────────────────────────────────────────────────────────────────

function toApiUrl(relativePath: string | undefined): string | null {
  if (!relativePath) return null;
  const clean = relativePath
    .replace(/^storage_data\/images\//, '')
    .replace(/^images\//, '');
  return `/api/images/${clean}`;
}

// ── Inner loader ──────────────────────────────────────────────────────────────

interface LoaderProps {
  vinyl:      VinylMaterial;
  children:   React.ReactNode;
}

function VinylMaterialLoader({ vinyl, children }: LoaderProps) {
  const diffuseUrl = toApiUrl(vinyl.diffuseMapPath);
  const bumpUrl    = toApiUrl(vinyl.bumpMapPath);
  const normalUrl  = toApiUrl(vinyl.normalMapPath);

  // Build the URL map — only include keys whose URLs resolved
  const urlMap = useMemo(() => {
    const m: Record<string, string> = {};
    if (diffuseUrl) m.diffuse = diffuseUrl;
    if (bumpUrl)    m.bump    = bumpUrl;
    if (normalUrl)  m.normal  = normalUrl;
    // Fallback: use the visible swatch image when no PBR maps exist
    if (!diffuseUrl) m.diffuse = vinyl.imageUrl;
    return m;
  }, [diffuseUrl, bumpUrl, normalUrl, vinyl.imageUrl]);

  const textures = useTexture(urlMap) as Record<string, THREE.Texture>;

  // ── Tile repeat — physically correct grain size across the room ──────────
  // scale_factor from the material's renderParams drives how "zoomed-in" the
  // grain appears.  We multiply by 2 because our NDC space spans 2 units.
  const TILE = (vinyl.renderParams?.scale_factor ?? 1) * 2;

  for (const tex of Object.values(textures)) {
    tex.wrapS      = THREE.RepeatWrapping;
    tex.wrapT      = THREE.RepeatWrapping;
    tex.repeat.set(TILE, TILE);
    tex.needsUpdate = true;
  }

  // ── Grain rotation on the diffuse map ────────────────────────────────────
  const grainRad =
    (vinyl.renderParams?.grain_direction === 'horizontal' ? 90 : 0) * (Math.PI / 180);
  if (textures.diffuse) {
    textures.diffuse.rotation = grainRad;
    textures.diffuse.center.set(0.5, 0.5);   // rotate around texture centre
  }

  // ── PBR material ──────────────────────────────────────────────────────────
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map:          textures.diffuse  ?? null,
      roughnessMap: textures.bump     ?? null,
      normalMap:    textures.normal   ?? null,
      roughness:    vinyl.pbr.roughness,
      metalness:    vinyl.pbr.specular * 0.25,
      transparent:  true,
      opacity:      0.88,
      side:         THREE.FrontSide,
      depthWrite:   false,   // prevent depth artifacts on flat overlay geometry
    });
    mat.color.set(vinyl.colorHex);
    return mat;
  // textures object identity changes when maps reload — that's the correct signal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textures.diffuse, textures.bump, textures.normal,
      vinyl.colorHex, vinyl.pbr.roughness, vinyl.pbr.specular]);

  const ctxValue = useMemo<VinylCtxValue>(
    () => ({ material, tileRepeat: TILE }),
    [material, TILE]
  );

  return (
    <VinylMaterialCtx.Provider value={ctxValue}>
      {children}
    </VinylMaterialCtx.Provider>
  );
}

// ── Public provider ───────────────────────────────────────────────────────────

interface MasterVinylMaterialProps {
  vinyl:    VinylMaterial;
  children: React.ReactNode;
}

export function MasterVinylMaterial({ vinyl, children }: MasterVinylMaterialProps) {
  return (
    <React.Suspense fallback={null}>
      <VinylMaterialLoader vinyl={vinyl}>{children}</VinylMaterialLoader>
    </React.Suspense>
  );
}

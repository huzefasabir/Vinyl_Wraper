/**
 * MaskMesh
 * ────────
 * Renders one flat PlaneGeometry per SpaceSegment.
 *
 * WORLD-SPACE UV CONTINUITY
 * ─────────────────────────
 * The key insight: every cabinet door and drawer front must look like they were
 * wrapped from the same roll of vinyl — grain lines must flow across boundaries.
 *
 * We achieve this by computing a UV offset for each mesh so that the texture
 * coordinate at any screen position is the same regardless of which mesh
 * "owns" that pixel.  The formula per mesh:
 *
 *   uOffset = bb.x * TILE_REPEAT          (left edge of bbox in NDC → UV space)
 *   vOffset = (1 - bb.y - bb.height) * TILE_REPEAT   (top edge, Y-flipped)
 *
 * This shifts the texture origin so that a 1×1 UV tile covers the same physical
 * area of the room across every mask, producing seamless grain flow.
 *
 * Z-FIGHTING PREVENTION
 * ─────────────────────
 * Each plane sits at z = 0.01 in front of the background image at z = 0.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SpaceSegment } from '../../types';
import { useVinylMaterial, useVinylTileRepeat } from './MasterVinylMaterial';

interface MaskMeshProps {
  segment: SpaceSegment;
  imageAspect: number;
  isSelected?: boolean;
}

export function MaskMesh({
  segment,
  imageAspect,
  isSelected = false,
}: MaskMeshProps) {
  const sharedMaterial = useVinylMaterial();
  // Read tile-repeat from context — always in sync with MasterVinylMaterial
  const tileRepeat = useVinylTileRepeat();
  const meshRef = useRef<THREE.Mesh>(null!);

  // ── NDC position + scale from normalised bounding box ─────────────────────
  const { position, scale, uvOffset } = useMemo(() => {
    const bb = segment.boundingBox ?? { x: 0, y: 0, width: 1, height: 1 };

    // Centre of the bounding box in NDC [-1,1] space
    const cx =  (bb.x + bb.width  / 2) * 2 - 1;
    const cy = -((bb.y + bb.height / 2) * 2 - 1);   // Y-flip: image top = NDC +1

    // World-space UV offset — anchors the texture relative to the whole image,
    // not relative to this individual mesh, so grain is continuous across masks.
    const uOff =  bb.x      * tileRepeat;
    const vOff = (1 - bb.y - bb.height) * tileRepeat;   // Y-flip matches NDC

    return {
      position:  [cx, cy, 0.01] as [number, number, number],
      scale:     [bb.width * 2, bb.height * 2, 1] as [number, number, number],
      uvOffset:  new THREE.Vector2(uOff, vOff),
    };
  }, [segment.boundingBox, tileRepeat]);

  // ── Per-instance material clone ────────────────────────────────────────────
  // Cloning lets us set a unique UV offset and opacity per mesh without touching
  // the shared master material that all other masks are using.
  const instanceMaterial = useMemo(() => {
    if (!sharedMaterial) return null;
    const m = sharedMaterial.clone();

    // Apply world-space UV offset on every texture map that is present
    const applyOffset = (tex: THREE.Texture | null) => {
      if (!tex) return;
      // Clone the texture so the offset doesn't bleed back to the master
      const t = tex.clone();
      t.needsUpdate = true;
      t.offset.copy(uvOffset);
      return t;
    };

    if (m.map)          m.map          = applyOffset(m.map)          ?? m.map;
    if (m.roughnessMap) m.roughnessMap = applyOffset(m.roughnessMap) ?? m.roughnessMap;
    if (m.normalMap)    m.normalMap    = applyOffset(m.normalMap)    ?? m.normalMap;

    m.opacity    = isSelected ? 0.93 : 0.84;
    m.needsUpdate = true;
    return m;
  // sharedMaterial reference changes when vinyl changes — that's intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedMaterial, uvOffset.x, uvOffset.y, isSelected]);

  // Dispose instance material on unmount to avoid GPU memory leaks
  useEffect(() => {
    return () => { instanceMaterial?.dispose(); };
  }, [instanceMaterial]);

  // ── Selection pulse ────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!instanceMaterial || !isSelected) return;
    instanceMaterial.opacity = 0.88 + Math.sin(clock.getElapsedTime() * 2.5) * 0.06;
  });

  if (!instanceMaterial) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      renderOrder={1}      // always renders on top of background
    >
      {/* 1×1 plane — scale drives the actual size in world-space NDC units */}
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={instanceMaterial} attach="material" />
    </mesh>
  );
}

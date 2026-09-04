/**
 * RoomVisualizer — Phase 2 rendering orchestrator
 * ─────────────────────────────────────────────────
 *
 * TWO STATES
 * ──────────
 * wrapApplied = false  (default)
 *   → Shows the HF Space annotated image as a plain <img>.
 *     No WebGL canvas, no meshes.  This is the clean segmentation preview.
 *
 * wrapApplied = true
 *   → Activates Phase 2 WebGL path:
 *       Layer 0  <img>          — 2D background (hfSegmented or original)
 *       Layer 1  <Canvas>       — Transparent R3F WebGL overlay
 *         ├─ OrthographicCamera  NDC [-1,1] frustum
 *         ├─ ambientLight        Soft fill
 *         ├─ directionalLight    Key light (upper-left, warm)
 *         ├─ directionalLight    Fill light (right, cool)
 *         └─ MasterVinylMaterial
 *              └─ {segments with appliedMaterial → MaskMesh}
 *
 * PERFORMANCE
 * ───────────
 * MasterVinylMaterial loads PBR textures exactly ONCE per vinyl change.
 * All MaskMesh nodes share the same compiled THREE.MeshStandardMaterial.
 * Changing vinyl in the UI updates the context → all masks re-render in one pass.
 */

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { Sparkles as SparklesIcon, Layers, Loader2 } from 'lucide-react';
import { SpaceSegment, Material, VolkaJobStatus } from '../../types';
import { MasterVinylMaterial } from './MasterVinylMaterial';
import { MaskMesh } from './MaskMesh';

interface RoomVisualizerProps {
  imageUrl:          string;
  hfSegmentedImage?: string;
  displayMode:       'original' | 'wrapped';
  segments:          SpaceSegment[];
  selectedSegmentId: string | null;
  selectedMaterial:  Material;
  volkaStatus?:      VolkaJobStatus;
  cvRenderStatus?:   'idle' | 'rendering' | 'done' | 'error';
  /** false = HF preview only; true = Phase 2 WebGL PBR overlay */
  wrapApplied?:      boolean;
  className?:        string;
}

export function RoomVisualizer({
  imageUrl,
  hfSegmentedImage,
  displayMode,
  segments,
  selectedSegmentId,
  selectedMaterial,
  volkaStatus,
  cvRenderStatus = 'idle',
  wrapApplied = false,
  className = '',
}: RoomVisualizerProps) {

  // ── Background image source ──────────────────────────────────────────────
  // Prefer HF segmented/annotated image in wrapped mode, original in original mode
  const bgSrc =
    displayMode === 'wrapped' && hfSegmentedImage
      ? hfSegmentedImage
      : imageUrl;

  // ── Image aspect ratio (for UV correction in MaskMesh) ──────────────────
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageAspect, setImageAspect] = useState(16 / 9);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const update = () => {
      if (el.naturalWidth && el.naturalHeight)
        setImageAspect(el.naturalWidth / el.naturalHeight);
    };
    el.addEventListener('load', update);
    update();
    return () => el.removeEventListener('load', update);
  }, [bgSrc]);

  // ── Segments that carry an applied material (drives mesh rendering) ──────
  // When cvRenderStatus === 'done', the Python backend OpenCV pipeline has already
  // generated the photorealistic composited vinyl image (bgSrc).
  // We unmount the WebGL Three.js overlay canvas so it does not draw a fake WebGL rectangle mesh on top.
  const isCvDone = cvRenderStatus === 'done';
  const isCvRendering = cvRenderStatus === 'rendering';
  const activeMeshSegments = (wrapApplied && !isCvDone)
    ? segments.filter((s) => !!s.appliedMaterial)
    : [];

  // ── Loading state ────────────────────────────────────────────────────────
  const showLoader = (volkaStatus === 'pending' || isCvRendering) && displayMode === 'wrapped';

  return (
    <div className={`relative w-full h-full ${className}`}>

      {/* ── Loading overlay ────────────────────────────────────────────── */}
      {showLoader && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#060f16]/95 backdrop-blur-md transition-all select-none">
          <div className="relative flex items-center justify-center w-20 h-20">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#38bdf8]/20 animate-ping" />
            <div className="w-16 h-16 rounded-full border-4 border-[#38bdf8]/20 border-t-[#38bdf8] animate-spin" />
            <SparklesIcon className="absolute w-6 h-6 text-[#38bdf8] animate-pulse" />
          </div>

          <div className="text-center px-6 max-w-sm">
            <h3 className="text-base font-bold text-[#dae3ee] mb-1 tracking-wide">
              {isCvRendering ? "Wrapping is being done, please wait" : "Segmenting target surfaces..."}
            </h3>
            <p className="text-xs font-mono text-[#38bdf8] flex items-center justify-center gap-1.5 mt-1">
              {isCvRendering ? (
                <>
                  <Layers className="w-3.5 h-3.5 inline" />
                  <span>Applying {selectedMaterial.sku} — {selectedMaterial.name}</span>
                </>
              ) : (
                <span>Grounded-SAM AI detecting room components</span>
              )}
            </p>
            <p className="text-[11px] text-[#87929a] mt-2">
              {isCvRendering
                ? "Synthesizing high-precision vinyl texture maps & lighting..."
                : "Segmented preview will appear when complete"}
            </p>
          </div>

          {/* Shimmer Progress Bar */}
          <div className="w-56 h-1.5 bg-[#182028] rounded-full overflow-hidden border border-[#3e484f]/40">
            <div className="h-full w-full bg-gradient-to-r from-[#38bdf8]/20 via-[#38bdf8] to-[#38bdf8]/20 animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        </div>
      )}

      {/* ── Layer 0: 2D background image ──────────────────────────────── */}
      {!showLoader && (
        <img
          ref={imgRef}
          src={bgSrc}
          alt="Room background"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          crossOrigin="anonymous"
        />
      )}



      {/* ── Layer 1: Transparent R3F WebGL overlay (wrapApplied only) ─── */}
      {!showLoader && activeMeshSegments.length > 0 && (
        <Canvas
          className="absolute inset-0 pointer-events-none"
          gl={{
            alpha:            true,
            antialias:        true,
            powerPreference:  'high-performance',
            preserveDrawingBuffer: false,
          }}
          style={{ background: 'transparent' }}
          flat          // disable tone-mapping — we want raw PBR output
        >
          {/* Orthographic camera: left/right/top/bottom = ±1 = full viewport */}
          <OrthographicCamera
            makeDefault
            left={-1} right={1} top={1} bottom={-1}
            near={0.01} far={10}
            position={[0, 0, 1]}
          />

          {/* ── Environment lighting ─────────────────────────────────── */}
          {/* Soft even fill — ensures no completely-unlit dark patches   */}
          <ambientLight intensity={0.55} color="#f0f0f0" />

          {/* Key light: upper-left, warm, mimics a kitchen overhead/window */}
          <directionalLight
            position={[-2, 3, 2]}
            intensity={1.1}
            color="#fff8e8"
            castShadow={false}
          />

          {/* Fill light: right side, cool, softens hard shadows */}
          <directionalLight
            position={[2, 1, 1]}
            intensity={0.3}
            color="#d0e8ff"
          />

          {/* ── PBR material + geometry ────────────────────────────────
               MasterVinylMaterial loads textures ONCE and shares them.
               Each MaskMesh clones the material and sets a world-space
               UV offset for seamless grain continuity across all masks. */}
          <Suspense fallback={null}>
            <MasterVinylMaterial vinyl={selectedMaterial}>
              {activeMeshSegments.map((seg) => (
                <MaskMesh
                  key={seg.id}
                  segment={seg}
                  imageAspect={imageAspect}
                  isSelected={seg.id === selectedSegmentId}
                />
              ))}
            </MasterVinylMaterial>
          </Suspense>
        </Canvas>
      )}

      {/* ── Error badge ───────────────────────────────────────────────── */}
      {volkaStatus === 'error' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2
                        bg-red-950/90 backdrop-blur-sm border border-red-500/50 rounded-xl
                        px-4 py-2 pointer-events-none shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-300">
            HF Space segmentation failed — showing original image
          </p>
        </div>
      )}
    </div>
  );
}

// Sparkles used in loader
function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

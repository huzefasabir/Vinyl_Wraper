import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  ChevronRight,
  Upload,
  ArrowRightLeft,
  Layers,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SpaceImage, SpaceSegment, Material, RenderParameters, StudioTool, VolkaJobStatus } from '../types';
import { MATERIALS } from '../data/materialsData';
import { RoomVisualizer } from './three/RoomVisualizer';
import { renderVinylWrap } from '../services/api';
import { log } from '../services/logger';

interface StudioCanvasProps {
  space: SpaceImage;
  segments: SpaceSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  selectedMaterial: Material;
  renderParameters: RenderParameters;
  activeTool: StudioTool;
  onApplyMaterialToSegment: (segmentId: string, material: Material) => void;
  onQuickApplyMaterial: (material: Material) => void;
  onNavigateToCatalog: () => void;
  onOpenSpecsModal: (material: Material) => void;
  volkaStatus?: VolkaJobStatus;
  /** Called with the composited PNG data-URL when the CV pipeline succeeds */
  onCvRenderComplete?: (compositeImageDataUrl: string) => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  space,
  segments,
  selectedSegmentId,
  onSelectSegment,
  selectedMaterial,
  renderParameters,
  activeTool,
  onApplyMaterialToSegment,
  onQuickApplyMaterial,
  onNavigateToCatalog,
  onOpenSpecsModal,
  volkaStatus,
  onCvRenderComplete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOverlays, setShowOverlays] = useState(false);
  // Default to 'wrapped' — shows wrapped/segmented room image; 'original' shows original upload photo
  const [displayMode, setDisplayMode] = useState<'original' | 'wrapped'>('wrapped');
  const [compareMode, setCompareMode] = useState<'single' | 'split'>('single');
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isHoveringSegment, setIsHoveringSegment] = useState<string | null>(null);
  const [brushStrokes, setBrushStrokes] = useState<{ x: number; y: number }[]>([]);
  const [isPainting, setIsPainting] = useState(false);

  // ── Wrap state ────────────────────────────────────────────────────────────
  // 'idle'      → clean HF image preview, no wrap
  // 'rendering' → CV pipeline running (spinner on button)
  // 'done'      → composited CV image displayed
  // 'error'     → pipeline failed, WebGL PBR fallback shown
  // ── Wrap state ────────────────────────────────────────────────────────────
  // 'idle'      → clean HF image preview, no wrap
  // 'rendering' → CV pipeline running (spinner on button)
  // 'done'      → composited CV image displayed
  // 'error'     → pipeline failed, WebGL PBR fallback shown
  const [cvRenderStatus, setCvRenderStatus] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const [wrapApplied, setWrapApplied]       = useState(false);
  const [cvErrorMsg, setCvErrorMsg]         = useState<string>('');

  // Preserve original HF Grounded-SAM segmentation mask image for repeated CV renders
  const originalMaskRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (space.hfSegmentedImage && cvRenderStatus === 'idle') {
      originalMaskRef.current = space.hfSegmentedImage;
    }
  }, [space.hfSegmentedImage, cvRenderStatus]);

  /**
   * handleApplyWrap
   * ───────────────
   * 1. Applies targetMaterial to every segment & updates active selectedMaterial in App.
   * 2. Calls the OpenCV CV pipeline via POST /api/vinyl-render:
   *      base image   = space.imageUrl  (original room photo)
   *      mask image   = originalMaskRef.current || space.hfSegmentedImage  (Grounded-SAM output)
   *      vinyl swatch = targetMaterial.diffuseMapPath || imageUrl
   * 3. On success: calls onCvRenderComplete with the composited PNG so
   *    App.tsx can update currentSpace.hfSegmentedImage → canvas re-renders
   * 4. On failure: falls back to the WebGL PBR overlay (wrapApplied=true)
   */
  const handleApplyWrap = async (targetMaterial: Material = selectedMaterial) => {
    if (cvRenderStatus === 'rendering') return;

    prevMaterialIdRef.current = targetMaterial.id;

    // Apply target material to the selected segment only
    const targetSegmentId = selectedSegmentId || segments[0]?.id;
    if (targetSegmentId) {
      onApplyMaterialToSegment(targetSegmentId, targetMaterial);
    }
    if (targetMaterial.id !== selectedMaterial.id) {
      onQuickApplyMaterial(targetMaterial);
    }
    setWrapApplied(true);
    setDisplayMode('wrapped');
    setCvRenderStatus('rendering');
    setCvErrorMsg('');

    const activeSeg = segments.find((s) => s.id === (selectedSegmentId || segments[0]?.id));
    const maskImageData = activeSeg?.maskBase64 || originalMaskRef.current || space.hfSegmentedImage;

    log.hf('StudioCanvas', `Apply Wrap: CV pipeline — target=${activeSeg?.name ?? 'surface'} vinyl=${targetMaterial.sku} mask=${maskImageData ? 'ready' : 'none'}`);

    // Require both the original image and the HF mask to run the CV pipeline
    if (!maskImageData) {
      log.warn('StudioCanvas', 'No HF mask image available — using WebGL PBR fallback');
      setCvRenderStatus('error');
      setCvErrorMsg('No segmentation mask — using WebGL preview');
      return;
    }

    // Build all swatch paths from the target material
    const stripImages = (p?: string) =>
      p ? p.replace(/^images\//, '').replace(/^storage_data\/images\//, '') : undefined;

    const diffusePath = stripImages(targetMaterial?.diffuseMapPath) ||
      (targetMaterial?.imageUrl ? targetMaterial.imageUrl.replace(/^\/api\/images\//, '').replace(/\.jpg$/i, '_diffuse.jpg') : undefined);
    const bumpPath    = stripImages(targetMaterial?.bumpMapPath);
    const normalPath  = stripImages(targetMaterial?.normalMapPath);
    const swatchPath  = targetMaterial?.imageUrl ? targetMaterial.imageUrl.replace(/^\/api\/images\//, '') : '';

    // PBR render params derived from the target material
    const renderParams = {
      grain_direction: targetMaterial.renderParams?.grain_direction ?? 'vertical',
      scale_factor:    targetMaterial.renderParams?.scale_factor    ?? 1.0,
      roughness:       targetMaterial.pbr?.roughness                ?? 0.55,
      reflectivity:    targetMaterial.pbr?.specular                 ?? 0.15,
      bump_intensity:  targetMaterial.renderParams?.bump_intensity  ?? 1.0,
    };

    try {
      const result = await renderVinylWrap({
        baseImageData:   space.imageUrl,
        maskImageData:   maskImageData,
        diffuseMapPath:  diffusePath,
        swatchImagePath: swatchPath,
        bumpMapPath:     bumpPath,
        normalMapPath:   normalPath,
        opacity:         1.0,
        renderParams,
      });

      if (result.success && result.compositeImage) {
        log.ok('StudioCanvas', `CV render done in ${result.render_stats?.elapsed_ms ?? '?'}ms`);
        setCvRenderStatus('done');
        onCvRenderComplete?.(result.compositeImage);
      } else {
        throw new Error('CV pipeline returned no composite image');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'CV render failed';
      log.error('StudioCanvas', `CV pipeline error: ${msg}`);
      setCvRenderStatus('error');
      setCvErrorMsg(msg);
    }
  };

  // Auto-trigger vinyl wrap render on initial HF completion, material change, segment change, or missing wrap
  const prevSegmentIdRef  = useRef<string | null>(selectedSegmentId);
  const prevMaterialIdRef = useRef<string>(selectedMaterial.id);
  const autoAppliedJobRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const activeSeg = segments.find((s) => s.id === (selectedSegmentId || segments[0]?.id));
    const maskAvailable = activeSeg?.maskBase64 || originalMaskRef.current || space.hfSegmentedImage;
    if (!maskAvailable || volkaStatus === 'pending') return;

    const segmentChanged   = prevSegmentIdRef.current !== selectedSegmentId;
    const materialChanged  = prevMaterialIdRef.current !== selectedMaterial.id;
    const currentJobKey    = space.volkaJobId || space.id;
    const hfJobCompleted   = volkaStatus === 'done' && autoAppliedJobRef.current !== currentJobKey;
    const needsInitialWrap = !wrapApplied && cvRenderStatus === 'idle';

    if (materialChanged || hfJobCompleted || needsInitialWrap || (segmentChanged && activeSeg?.appliedMaterial)) {
      prevSegmentIdRef.current  = selectedSegmentId;
      prevMaterialIdRef.current = selectedMaterial.id;
      autoAppliedJobRef.current = currentJobKey;
      handleApplyWrap(selectedMaterial);
    }
  }, [selectedMaterial, selectedSegmentId, segments, space.hfSegmentedImage, space.volkaJobId, space.id, volkaStatus, wrapApplied, cvRenderStatus]);

  // Strip materials from all segments, return to clean HF image preview
  const handleClearWrap = () => {
    segments.forEach((seg) => onApplyMaterialToSegment(seg.id, null as unknown as Material));
    setWrapApplied(false);
    setCvRenderStatus('idle');
    setCvErrorMsg('');
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Track the image src that is currently painted so we force re-draws on change
  const paintedSrcRef = useRef<string>('');

  // Related styles: materials arranged by sub-category matching selectedMaterial.
  // When user selects a material (e.g. Origin Wood), shows materials from that sub-category.
  const relatedStyles = React.useMemo(() => {
    const targetSubCat = selectedMaterial.subCategory;
    const targetSubCatName = selectedMaterial.subCategoryName?.toLowerCase();

    const sameSub = MATERIALS.filter((m) => {
      if (m.id === selectedMaterial.id) return false;
      if (targetSubCat && m.subCategory === targetSubCat) return true;
      if (targetSubCatName && m.subCategoryName && m.subCategoryName.toLowerCase() === targetSubCatName) return true;
      return false;
    });

    if (sameSub.length >= 4) return sameSub;

    // Fallback: fill with parent category if sub-category has very few items
    const sameCat = MATERIALS.filter(
      (m) => m.category === selectedMaterial.category && m.id !== selectedMaterial.id
    );
    const combined = [...sameSub, ...sameCat.filter((m) => !sameSub.some((s) => s.id === m.id))];
    return combined;
  }, [selectedMaterial.subCategory, selectedMaterial.subCategoryName, selectedMaterial.category, selectedMaterial.id]);

  // Selected segment object
  const activeSegment = segments.find((s) => s.id === selectedSegmentId) || segments[0];

  const hfImage   = space.hfSegmentedImage ?? null;
  const isPending = volkaStatus === 'pending';
  // Original Room -> original uploaded space.imageUrl; Wrapped Room -> hfImage or composite render
  const baseImageSrc = displayMode === 'original' ? space.imageUrl : (hfImage || space.imageUrl);
  const showLoader = isPending && displayMode === 'wrapped';

  // Core paint function — takes an already-loaded HTMLImageElement so we avoid
  // the async onload problem (stale closure / cached-image-no-onload).
  const paintToCanvas = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use a fixed display resolution so the canvas always fills the container
      // without cropping. We letter-box (contain) the image inside the canvas.
      const DISPLAY_W = 1280;
      const DISPLAY_H = 720;
      canvas.width  = DISPLAY_W;
      canvas.height = DISPLAY_H;

      // ── background ───────────────────────────────────────────────────────
      if (displayMode === 'wrapped') {
        const bgGrad = ctx.createRadialGradient(
          DISPLAY_W / 2, DISPLAY_H / 2, 50,
          DISPLAY_W / 2, DISPLAY_H / 2, Math.max(DISPLAY_W, DISPLAY_H)
        );
        bgGrad.addColorStop(0, '#182430');
        bgGrad.addColorStop(1, '#090e14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, DISPLAY_W, DISPLAY_H);
        ctx.strokeStyle = 'rgba(56,189,248,0.06)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < DISPLAY_W; gx += 40) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, DISPLAY_H); ctx.stroke();
        }
        for (let gy = 0; gy < DISPLAY_H; gy += 40) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(DISPLAY_W, gy); ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#060f16';
        ctx.fillRect(0, 0, DISPLAY_W, DISPLAY_H);
      }

      // ── contain-fit the image (letterbox) ────────────────────────────────
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = DISPLAY_W / DISPLAY_H;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgAspect > canvasAspect) {
        drawW = DISPLAY_W;
        drawH = DISPLAY_W / imgAspect;
        drawX = 0;
        drawY = (DISPLAY_H - drawH) / 2;
      } else {
        drawH = DISPLAY_H;
        drawW = DISPLAY_H * imgAspect;
        drawX = (DISPLAY_W - drawW) / 2;
        drawY = 0;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // ── vinyl material overlays ───────────────────────────────────────────
      // If CV render status is 'done', the canvas image is ALREADY the photorealistic
      // OpenCV composite image returned from the backend pipeline.
      // We skip drawing procedural 2D canvas color & grain overlays on top to avoid
      // covering the photorealistic CV render with fake 2D rectangle blocks.
      if (cvRenderStatus !== 'done') {
        segments.forEach((seg) => {
          const mat = seg.appliedMaterial;
          if (!mat || !seg.boundingBox) return;

          // Scale bounding box to the actual drawn image rect (not the full canvas)
          const bx = drawX + seg.boundingBox.x * drawW;
          const by = drawY + seg.boundingBox.y * drawH;
          const bw = seg.boundingBox.width  * drawW;
          const bh = seg.boundingBox.height * drawH;

          ctx.save();
          ctx.beginPath();
          if (seg.pathCoordinates && seg.pathCoordinates.length > 2) {
            seg.pathCoordinates.forEach((pt, i) => {
              const px = drawX + pt.x * drawW;
              const py = drawY + pt.y * drawH;
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
          } else {
            ctx.rect(bx, by, bw, bh);
          }
          ctx.clip();

          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = mat.colorHex;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(bx, by, bw, bh);
          ctx.globalCompositeOperation = 'source-over';

          const grainAngle = (renderParameters.grainDirection * Math.PI) / 180;
          ctx.save();
          ctx.translate(bx + bw / 2, by + bh / 2);
          ctx.rotate(grainAngle);
          ctx.translate(-(bx + bw / 2), -(by + bh / 2));
          ctx.strokeStyle = 'rgba(0,0,0,0.10)';
          ctx.lineWidth = 1.2;
          for (let y = by - 50; y < by + bh + 50; y += 7 * (renderParameters.textureScale || 1)) {
            ctx.beginPath(); ctx.moveTo(bx - 50, y); ctx.lineTo(bx + bw + 50, y + 1.5); ctx.stroke();
          }
          ctx.restore();

          const roughnessNorm = (renderParameters.roughness || 80) / 100;
          const reflNorm      = (renderParameters.reflectivity || 20) / 100;
          const specGradient  = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
          specGradient.addColorStop(0, `rgba(255,255,255,${(1 - roughnessNorm) * reflNorm * 0.45})`);
          specGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
          specGradient.addColorStop(1, 'rgba(0,0,0,0.15)');
          ctx.fillStyle  = specGradient;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(bx, by, bw, bh);
          ctx.restore();
        });
      }

      // ── split comparison ──────────────────────────────────────────────────
      if (compareMode === 'split') {
        const splitX = (splitPos / 100) * DISPLAY_W;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, splitX, DISPLAY_H); ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, DISPLAY_H); ctx.stroke();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, displayMode, renderParameters, compareMode, splitPos, hfImage, space.imageUrl, cvRenderStatus]
  );

  // Main render effect — skip painting entirely while HF job is pending so the
  // loading overlay is the only thing visible. Once status flips to done/error/idle
  // the effect re-runs with the correct baseImageSrc.
  useEffect(() => {
    if (showLoader) return; // don't paint behind the loader

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      paintedSrcRef.current = baseImageSrc;
      paintToCanvas(img);
    };

    if (baseImageSrc.startsWith('data:')) {
      fetch(baseImageSrc)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const blobImg = new Image();
          blobImg.onload = () => {
            paintedSrcRef.current = baseImageSrc;
            paintToCanvas(blobImg);
            URL.revokeObjectURL(url);
          };
          blobImg.src = url;
        })
        .catch(() => {
          img.src = baseImageSrc;
          if (img.complete && img.naturalWidth > 0) paintToCanvas(img);
        });
    } else {
      img.src = baseImageSrc;
      if (img.complete && img.naturalWidth > 0) {
        paintedSrcRef.current = baseImageSrc;
        paintToCanvas(img);
      }
    }
  }, [baseImageSrc, paintToCanvas, showLoader]);

  // Handle interactive brushing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'lasso') {
      setIsPainting(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setBrushStrokes((prev) => [...prev, { x, y }]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPainting) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setBrushStrokes((prev) => [...prev, { x, y }]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      // Auto apply to active segment on brush completion
      if (activeSegment) {
        onApplyMaterialToSegment(activeSegment.id, selectedMaterial);
      }
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#060f16] relative overflow-hidden select-none">
      {/* 1. Canvas Top Utility Bar */}
      <div className="h-12 bg-[#0b141c]/90 backdrop-blur-md border-b border-[#3e484f]/30 px-4 flex items-center justify-between z-20">
        {/* Left: Space Title & View Mode Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#dae3ee]">{space.title}</span>
            <span className="text-[10px] font-mono text-[#87929a] bg-[#182028] px-2 py-0.5 rounded border border-[#3e484f]/40">
              {segments.length} Zones Detected
            </span>
          </div>

          <div className="h-4 w-px bg-[#3e484f]/40 mx-1 hidden sm:block" />

          {/* Mode Switch: Original Room vs Wrapped Room */}
          <div className="hidden sm:flex items-center bg-[#182028] p-0.5 rounded-lg border border-[#3e484f]/40 text-xs">
            <button
              onClick={() => setDisplayMode('original')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                displayMode === 'original'
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee]'
              }`}
              title="Show original room image"
            >
              Original Room
            </button>
            <button
              onClick={() => setDisplayMode('wrapped')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                displayMode === 'wrapped'
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee]'
              }`}
              title="Show wrapped room visualizer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Wrapped Room</span>
              {isPending && displayMode !== 'wrapped' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" title="Processing..." />
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-[#3e484f]/40 mx-1 hidden sm:block" />

          {/* Compare Mode Switch */}
          <div className="hidden sm:flex items-center bg-[#182028] p-0.5 rounded-lg border border-[#3e484f]/40 text-xs">
            <button
              onClick={() => setCompareMode('single')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                compareMode === 'single'
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee]'
              }`}
            >
              Full Render
            </button>
            <button
              onClick={() => setCompareMode('split')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                compareMode === 'split'
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee]'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Split Comparison</span>
            </button>
          </div>
        </div>

        {/* Right: Viewport Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Overlay Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showOverlays
                ? 'bg-[#182028] border-[#38bdf8]/50 text-[#38bdf8]'
                : 'bg-[#141c24] border-[#3e484f]/40 text-[#87929a]'
            }`}
            title="Toggle Segment Selection Outlines"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Outlines</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#182028] rounded-lg border border-[#3e484f]/40 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 text-[#87929a] hover:text-[#dae3ee] hover:bg-[#222b33] rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#dae3ee] px-2">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="p-1 text-[#87929a] hover:text-[#dae3ee] hover:bg-[#222b33] rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-[#182028] border border-[#3e484f]/40 text-[#87929a] hover:text-[#dae3ee]"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Viewport Area */}
      <div
        ref={viewportRef}
        onMouseDown={(e) => {
          if (compareMode === 'split') {
            setIsDraggingSplit(true);
            if (viewportRef.current) {
              const rect = viewportRef.current.getBoundingClientRect();
              const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              setSplitPos(pct);
            }
          } else {
            handleCanvasMouseDown(e);
          }
        }}
        onMouseMove={(e) => {
          if (compareMode === 'split' && isDraggingSplit && viewportRef.current) {
            const rect = viewportRef.current.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            setSplitPos(pct);
          } else {
            handleCanvasMouseMove(e);
          }
        }}
        onMouseUp={() => {
          setIsDraggingSplit(false);
          handleCanvasMouseUp();
        }}
        className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
      >
        <div
          className="relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#3e484f]/60 bg-[#0b141c] flex items-center justify-center group"
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
        >
          {compareMode === 'split' ? (
            /* ── SPLIT COMPARISON MODE: ORIGINAL PHOTO vs RENDER ─────────── */
            <div className="relative w-full h-full overflow-hidden select-none">
              {/* Right/Bottom Layer: Wrapped Vinyl Render */}
              <div className="absolute inset-0 w-full h-full">
                <RoomVisualizer
                  imageUrl={space.imageUrl}
                  hfSegmentedImage={space.hfSegmentedImage}
                  displayMode="wrapped"
                  segments={segments}
                  selectedSegmentId={selectedSegmentId}
                  selectedMaterial={selectedMaterial}
                  volkaStatus={volkaStatus}
                  cvRenderStatus={cvRenderStatus}
                  wrapApplied={wrapApplied}
                  className="w-full h-full"
                />
              </div>

              {/* Left/Top Layer: Original Uploaded Picture (Clipped) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
              >
                <img
                  src={space.imageUrl}
                  alt="Original room photo"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Draggable Divider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center -translate-x-1/2"
                style={{ left: `${splitPos}%` }}
              >
                <div className="w-0.5 h-full bg-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                <div className="absolute w-8 h-8 rounded-full bg-[#0b141c] border-2 border-[#38bdf8] text-[#38bdf8] shadow-lg flex items-center justify-center text-xs">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>

              {/* View Badges */}
              <div className="absolute top-3 left-3 z-20 bg-[#0b141c]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-[#dae3ee] border border-[#3e484f]/40 pointer-events-none shadow-md">
                Original Photo
              </div>
              <div className="absolute top-3 right-3 z-20 bg-[#0b141c]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-[#38bdf8] font-bold border border-[#38bdf8]/40 pointer-events-none shadow-md">
                Vinyl Render
              </div>
            </div>
          ) : displayMode === 'wrapped' ? (
            <RoomVisualizer
              imageUrl={space.imageUrl}
              hfSegmentedImage={space.hfSegmentedImage}
              displayMode={displayMode}
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              selectedMaterial={selectedMaterial}
              volkaStatus={volkaStatus}
              cvRenderStatus={cvRenderStatus}
              wrapApplied={wrapApplied}
              className="w-full h-full"
            />
          ) : (
            <>
              {/* 2D canvas for Full Room mode */}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
              {/* Error badge in full-room mode */}
              {volkaStatus === 'error' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-red-950/90 backdrop-blur-sm border border-red-500/50 rounded-xl px-4 py-2 pointer-events-none shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-xs font-semibold text-red-300">
                    HF Space segmentation failed — showing original image
                  </p>
                </div>
              )}
            </>
          )}

          {/* Brush strokes overlay (both modes) */}
          {brushStrokes.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.65"
                points={brushStrokes.map((p) => `${p.x * 100}%,${p.y * 100}%`).join(' ')}
              />
            </svg>
          )}

          {/* ── Wrap Status Badge ───────────────────────────────────────── */}
          {wrapApplied ? (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-[#0b141c]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#38bdf8]/50 shadow-lg shadow-[#38bdf8]/10 pointer-events-none">
              {cvRenderStatus === 'rendering' && (
                <Loader2 className="w-3 h-3 text-[#38bdf8] animate-spin flex-shrink-0" />
              )}
              {cvRenderStatus === 'done' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              )}
              {cvRenderStatus === 'error' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider">
                  {cvRenderStatus === 'rendering' && 'CV RENDERING…'}
                  {cvRenderStatus === 'done'      && 'CV RENDER · DONE'}
                  {cvRenderStatus === 'error'     && 'WebGL PBR · FALLBACK'}
                  {cvRenderStatus === 'idle'      && 'WRAP ACTIVE · WebGL'}
                </span>
                <span className="text-[11px] text-[#dae3ee] font-semibold">
                  {selectedMaterial.sku} — {selectedMaterial.name}
                </span>
                {cvRenderStatus === 'error' && cvErrorMsg && (
                  <span className="text-[10px] text-amber-400 font-mono truncate max-w-[220px]">
                    {cvErrorMsg}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-4 right-4 z-20 bg-[#0b141c]/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider text-[#87929a] border border-[#3e484f]/40 shadow-lg flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#87929a]" />
              <span>HF PREVIEW</span>
            </div>
          )}

          {/* Active Tool HUD */}
          {activeTool !== 'layers' && (
            <div className="absolute top-4 left-4 z-20 bg-[#0b141c]/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-[#dae3ee] border border-[#3e484f]/60 shadow-lg flex items-center gap-2">
              <span className="text-[#38bdf8] font-mono uppercase font-semibold text-[10px]">
                Active Tool:
              </span>
              <span className="capitalize">{activeTool}</span>
              <span className="text-[10px] text-[#87929a]">(Click or drag on surface)</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Horizontal Drawer: "RELATED STYLES" (Matching Screenshot) */}
      <div className="h-44 bg-[#0b141c] border-t border-[#3e484f]/40 p-3 sm:px-6 flex flex-col justify-between z-20 select-none">
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold text-[#87929a] uppercase tracking-widest">
              RELATED STYLES
            </span>
            <span className="text-xs text-[#38bdf8] font-medium flex items-center gap-1">
              <span>{selectedMaterial.categoryName}</span>
              <ChevronRight className="w-3 h-3 text-[#87929a]" />
              <span className="text-[#dae3ee]">{selectedMaterial.subCategoryName || 'All'}</span>
            </span>
          </div>

          <button
            onClick={onNavigateToCatalog}
            className="text-xs text-[#38bdf8] hover:text-[#8ed5ff] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel Row (Matching Screenshot Cards with "Apply" button) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {relatedStyles.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-44 bg-[#141c24] rounded-xl p-2 border border-[#3e484f]/30 hover:border-[#38bdf8]/50 transition-all flex flex-col justify-between group shadow-sm"
            >
              {/* Texture thumbnail */}
              <div
                className="w-full h-16 rounded-lg bg-cover bg-center mb-1.5 relative overflow-hidden"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              >
                <button
                  onClick={() => onOpenSpecsModal(item)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-mono text-white transition-opacity"
                >
                  Specs
                </button>
              </div>

              {/* SKU & Title */}
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] font-mono font-semibold text-[#38bdf8] uppercase">
                  {item.sku}
                </span>
                <span className="text-[11px] text-[#dae3ee] font-medium truncate max-w-[90px]">
                  {item.name}
                </span>
              </div>

              {/* Apply CTA Button */}
              <button
                onClick={() => handleApplyWrap(item)}
                disabled={cvRenderStatus === 'rendering'}
                className={`w-full py-1 rounded-md text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedMaterial.id === item.id && wrapApplied
                    ? 'bg-[#38bdf8] text-[#00354a] border-[#38bdf8]'
                    : 'bg-[#182028] hover:bg-[#38bdf8] hover:text-[#00354a] text-[#dae3ee] border-[#3e484f]/40 hover:border-[#38bdf8]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {cvRenderStatus === 'rendering' && selectedMaterial.id === item.id ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Applying…</span>
                  </>
                ) : selectedMaterial.id === item.id && wrapApplied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#00354a]" />
                    <span>Applied</span>
                  </>
                ) : (
                  <span>Apply</span>
                )}
              </button>
            </div>
          ))}

          {/* Custom Upload Texture Slot */}
          <div
            onClick={onNavigateToCatalog}
            className="flex-shrink-0 w-36 h-28 rounded-xl border border-dashed border-[#3e484f]/60 hover:border-[#38bdf8] bg-[#141c24]/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-5 h-5 text-[#87929a] group-hover:text-[#38bdf8] mb-1" />
            <span className="text-[11px] font-medium text-[#dae3ee] group-hover:text-[#38bdf8]">
              Custom Texture
            </span>
            <span className="text-[9px] text-[#87929a]">Import tile</span>
          </div>
        </div>
      </div>
    </main>
  );
};

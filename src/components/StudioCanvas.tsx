import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Upload,
  Layers,
  ArrowRightLeft,
  Sun,
  Camera
} from 'lucide-react';
import { SpaceImage, SpaceSegment, Material, RenderParameters, StudioTool } from '../types';
import { MATERIALS } from '../data/materialsData';

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
  onOpenSpecsModal
}) => {
  const [zoom, setZoom] = useState(1);
  const [showOverlays, setShowOverlays] = useState(false);
  const [compareMode, setCompareMode] = useState<'single' | 'split'>('single');
  const [splitPos, setSplitPos] = useState(50);
  const [isHoveringSegment, setIsHoveringSegment] = useState<string | null>(null);
  const [brushStrokes, setBrushStrokes] = useState<{ x: number; y: number }[]>([]);
  const [isPainting, setIsPainting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Related style quick swatches
  const relatedStyles = MATERIALS.slice(0, 4);

  // Selected segment object
  const activeSegment = segments.find((s) => s.id === selectedSegmentId) || segments[0];

  // Draw custom canvas texture projection
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = space.imageUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const w = canvas.width;
      const h = canvas.height;

      // Draw base space photo
      ctx.drawImage(img, 0, 0, w, h);

      // Render applied materials on segments
      segments.forEach((seg) => {
        const mat =
          seg.appliedMaterial ||
          (seg.defaultMaterialSku
            ? MATERIALS.find(
                (m) =>
                  m.sku.toLowerCase() === seg.defaultMaterialSku?.toLowerCase() ||
                  m.code.toLowerCase() === seg.defaultMaterialSku?.toLowerCase()
              )
            : null);
        if (!mat || !seg.boundingBox) return;

        const bx = seg.boundingBox.x * w;
        const by = seg.boundingBox.y * h;
        const bw = seg.boundingBox.width * w;
        const bh = seg.boundingBox.height * h;

        ctx.save();
        // Clip to bounding box or path
        ctx.beginPath();
        if (seg.pathCoordinates && seg.pathCoordinates.length > 2) {
          seg.pathCoordinates.forEach((pt, i) => {
            const px = pt.x * w;
            const py = pt.y * h;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
        } else {
          ctx.rect(bx, by, bw, bh);
        }
        ctx.clip();

        // Blend texture color tint
        ctx.fillStyle = mat.colorHex;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(bx, by, bw, bh);

        // Simulated grain direction
        const grainAngle = (renderParameters.grainDirection * Math.PI) / 180;
        ctx.save();
        ctx.translate(bx + bw / 2, by + bh / 2);
        ctx.rotate(grainAngle);
        ctx.translate(-(bx + bw / 2), -(by + bh / 2));

        // Create micro grain stripes
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1.5;
        for (let y = by - 50; y < by + bh + 50; y += 8 * (renderParameters.textureScale || 1)) {
          ctx.beginPath();
          ctx.moveTo(bx - 50, y);
          ctx.lineTo(bx + bw + 50, y + 2);
          ctx.stroke();
        }
        ctx.restore();

        // Lighting & Specular reflection highlights
        const roughnessNorm = (renderParameters.roughness || 80) / 100;
        const reflNorm = (renderParameters.reflectivity || 20) / 100;
        const specGradient = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        specGradient.addColorStop(0, `rgba(255,255,255, ${(1 - roughnessNorm) * reflNorm * 0.45})`);
        specGradient.addColorStop(0.5, 'rgba(255,255,255, 0.05)');
        specGradient.addColorStop(1, 'rgba(0,0,0, 0.2)');

        ctx.fillStyle = specGradient;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(bx, by, bw, bh);

        ctx.restore();
      });

      // If split view comparison is active
      if (compareMode === 'split') {
        const splitX = (splitPos / 100) * w;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();

        // Split line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, h);
        ctx.stroke();
      }
    };
  }, [space, segments, renderParameters, compareMode, splitPos]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

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

        {/* Right: Viewport Controls (Overlays, Zoom, Fit) */}
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

      {/* 2. Main Viewport Area (Canvas Centerpiece) */}
      <div
        ref={viewportRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      >
        {/* Viewport Frame with 16px radius and dark border */}
        <div
          className="relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#3e484f]/60 bg-[#0b141c] flex items-center justify-center group"
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
        >
          {/* HTML5 Render Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Interactive Clickable/Hoverable Surface Segment Hotspots (Commented out for time being as requested) */}
          {/*
          {showOverlays && (
            <div className="absolute inset-0 pointer-events-auto">
              {segments.map((seg) => {
                if (!seg.boundingBox) return null;
                const isSelected = selectedSegmentId === seg.id;
                const isHovered = isHoveringSegment === seg.id;

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSegment(seg.id);
                      onApplyMaterialToSegment(seg.id, selectedMaterial);
                    }}
                    onMouseEnter={() => setIsHoveringSegment(seg.id)}
                    onMouseLeave={() => setIsHoveringSegment(null)}
                    style={{
                      left: `${seg.boundingBox.x * 100}%`,
                      top: `${seg.boundingBox.y * 100}%`,
                      width: `${seg.boundingBox.width * 100}%`,
                      height: `${seg.boundingBox.height * 100}%`
                    }}
                    className={`absolute rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center ${
                      isSelected
                        ? 'border-2 border-[#38bdf8] bg-[#38bdf8]/15 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : isHovered
                        ? 'border border-[#38bdf8]/60 bg-[#38bdf8]/10'
                        : 'border border-dashed border-white/20 hover:border-[#38bdf8]/50'
                    }`}
                  >
                    {(isSelected || isHovered) && (
                      <div className="absolute -top-3 left-2 bg-[#0b141c]/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-[#38bdf8] border border-[#38bdf8]/40 shadow-lg flex items-center gap-1 pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
                        <span>{seg.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          */}

          {/* Custom Brush Strokes overlay preview */}
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

          {/* PREVIEW MODE Floating Badge (Matching Screenshot) */}
          <div className="absolute bottom-4 right-4 z-20 bg-[#0b141c]/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wider text-[#38bdf8] border border-[#38bdf8]/40 shadow-lg flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span>PREVIEW MODE</span>
          </div>

          {/* Active Tool HUD Indicator */}
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
              <span>Architectural Woods</span>
              <ChevronRight className="w-3 h-3 text-[#87929a]" />
              <span className="text-[#dae3ee]">All Woods</span>
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
                onClick={() => {
                  if (activeSegment) {
                    onApplyMaterialToSegment(activeSegment.id, item);
                  }
                  onQuickApplyMaterial(item);
                }}
                className="w-full py-1 rounded-md bg-[#182028] hover:bg-[#38bdf8] hover:text-[#00354a] text-[#dae3ee] text-xs font-semibold border border-[#3e484f]/40 hover:border-[#38bdf8] transition-all"
              >
                Apply
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

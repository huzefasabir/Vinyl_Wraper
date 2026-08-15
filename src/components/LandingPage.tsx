import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  Eye, 
  Scan, 
  Maximize2,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { DropZone } from './DropZone';
import { TargetSurfaceModal } from './TargetSurfaceModal';
import { SpaceImage, Material } from '../types';
import { MATERIALS } from '../data/materialsData';
import { PRESET_SPACES } from '../data/presetSpaces';

interface LandingPageProps {
  onSelectSpace: (space: SpaceImage) => void;
  onConfirmTargetAndProceed: (space: SpaceImage, targetName: string) => void;
  onNavigateToStudio: () => void;
  onNavigateToCatalog: () => void;
  onOpenSpecsModal: (material: Material) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectSpace,
  onConfirmTargetAndProceed,
  onNavigateToStudio,
  onNavigateToCatalog,
  onOpenSpecsModal
}) => {
  // Target Surface Modal state post-upload
  const [pendingSpace, setPendingSpace] = useState<SpaceImage | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Interactive 3-step feature showcase live tab
  const [activeFeatureStep, setActiveFeatureStep] = useState<number>(0);

  // Real catalogue style showcase items
  const reelSkus = ['OGW01', 'BLC01', 'PM003', 'SPW01', 'SMT01'];
  const reelMaterials = (reelSkus
    .map(sku => MATERIALS.find(m => m.sku.toUpperCase() === sku.toUpperCase() || m.code.toUpperCase() === sku.toUpperCase()))
    .filter((m): m is Material => Boolean(m)).length > 0)
    ? reelSkus
        .map(sku => MATERIALS.find(m => m.sku.toUpperCase() === sku.toUpperCase() || m.code.toUpperCase() === sku.toUpperCase()))
        .filter((m): m is Material => Boolean(m))
    : MATERIALS.slice(0, 5);

  const handleUploadReady = (space: SpaceImage) => {
    setPendingSpace(space);
    setIsTargetModalOpen(true);
  };

  const handleConfirmTarget = (targetName: string) => {
    if (pendingSpace) {
      setIsTargetModalOpen(false);
      onConfirmTargetAndProceed(pendingSpace, targetName);
    }
  };

  const showcaseSteps = [
    {
      stepNumber: '01',
      title: 'Smart Surface Detection',
      tagline: 'AI Neural Segmentation',
      desc: 'Deep learning models isolate cabinet doors, waterfall counter edges, drawer panels, and wall planes with sub-pixel perspective and normal vector estimation.',
      icon: Scan,
      badge: 'Zone Mapping Active',
      previewType: 'segmentation'
    },
    {
      stepNumber: '02',
      title: 'PBR Texture Mapping',
      tagline: 'Physical Micro-Geometry',
      desc: 'Context-aware anisotropic grain alignment, microscopic embossed normal vectors, and custom UV projection prevent repetitive tiling across large horizons.',
      icon: Sliders,
      badge: 'Normal & Bump Calibrated',
      previewType: 'pbr'
    },
    {
      stepNumber: '03',
      title: 'Photorealistic Studio Render',
      tagline: 'Ray-Traced Ambient Preservation',
      desc: 'Live ambient occlusion preservation, diffuse radiance bounce, and specular glare matching maintain the natural room lighting without flat CGI artifacts.',
      icon: Sparkles,
      badge: '4K Specular Accurate',
      previewType: 'render'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] pt-20 pb-20 overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative px-4 sm:px-8 max-w-6xl mx-auto text-center mb-16 pt-6">
        {/* Glow background backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-72 bg-gradient-to-tr from-[#38bdf8]/15 via-[#bdc2ff]/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        {/* Hero status badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#182028] border border-[#3e484f]/60 text-xs font-mono text-[#38bdf8] mb-6 shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span>● VINYLWRAP STUDIO V2.4 LIVE</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#dae3ee] tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
          Transform Interior Surfaces with{' '}
          <span className="bg-gradient-to-r from-[#38bdf8] via-[#8ed5ff] to-[#bdc2ff] bg-clip-text text-transparent">
            Real-Time AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#bdc8d1] max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a photo to see premium architectural vinyl wraps applied instantly to your cabinets, countertops, and furniture.
        </p>

        {/* Interactive Drag & Drop Upload Zone */}
        <DropZone 
          onSelectSpace={onSelectSpace} 
          onOpenTargetModal={handleUploadReady}
          onNavigateToStudio={onNavigateToStudio} 
        />
      </section>

      {/* 2. Interactive Feature & Workflow Showcase (3-Step Feature Pipeline Bento-Grid) */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto my-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#182028] border border-[#3e484f]/60 text-[11px] font-mono text-[#87929a] uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>High-Precision Pipeline</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#dae3ee] tracking-tight">
            How Architectural Neural Rendering Works
          </h2>
          <p className="text-xs sm:text-sm text-[#bdc8d1] mt-2 max-w-xl mx-auto">
            From raw mobile photo to ultra-high-fidelity commercial wrap simulation in three synchronized stages.
          </p>
        </div>

        {/* 3-Step Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {showcaseSteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeFeatureStep === idx;
            return (
              <div
                key={step.stepNumber}
                onClick={() => setActiveFeatureStep(idx)}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#182028] border-[#38bdf8] shadow-xl shadow-[#38bdf8]/10'
                    : 'bg-[#141c24] border-[#3e484f]/40 hover:border-[#38bdf8]/50 hover:bg-[#182028]/80'
                }`}
              >
                {/* Step indicator tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#38bdf8] text-[#00354a]' : 'bg-[#222b33] text-[#38bdf8] group-hover:bg-[#38bdf8]/20'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#222b33] text-[#87929a] border border-[#3e484f]/40">
                    STEP {step.stepNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[#38bdf8] font-medium tracking-wide block mb-1">
                    {step.tagline}
                  </span>
                  <h3 className="text-lg font-semibold text-[#dae3ee] mb-2 group-hover:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#bdc8d1] leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#3e484f]/30 flex items-center justify-between text-[11px]">
                  <span className="text-[#87929a] font-mono flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#38bdf8] animate-ping' : 'bg-emerald-400'}`} />
                    {step.badge}
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-[#38bdf8]' : 'text-[#87929a] group-hover:text-[#dae3ee]'}`}>
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Interactive Preview Box for Selected Step */}
        <div className="bg-[#141c24] border border-[#3e484f]/50 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#3e484f]/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#38bdf8] uppercase tracking-wider">
                Live Pipeline Viewport:
              </span>
              <span className="text-xs font-medium text-[#dae3ee]">
                {showcaseSteps[activeFeatureStep].title}
              </span>
            </div>

            {/* Step Switcher Buttons */}
            <div className="flex items-center gap-1 bg-[#182028] p-1 rounded-xl border border-[#3e484f]/40">
              {showcaseSteps.map((step, idx) => (
                <button
                  key={step.stepNumber}
                  onClick={() => setActiveFeatureStep(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    activeFeatureStep === idx
                      ? 'bg-[#38bdf8] text-[#00354a] font-bold shadow-sm'
                      : 'text-[#87929a] hover:text-[#dae3ee]'
                  }`}
                >
                  Step {step.stepNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Visual Stage Canvas */}
          <div className="relative w-full aspect-[16/8] sm:aspect-[21/9] rounded-xl overflow-hidden bg-[#0b141c] border border-[#3e484f]/40">
            {/* Base Image */}
            <img
              src={PRESET_SPACES[0].imageUrl}
              alt="Kitchen Showcase Preview"
              className="w-full h-full object-cover"
            />

            {/* Step 0 Overlay: Neural Segmentation Wireframe */}
            {activeFeatureStep === 0 && (
              <div className="absolute inset-0 bg-[#0b141c]/40 backdrop-blur-xs flex flex-col justify-between p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-md bg-[#182028]/90 border border-[#38bdf8]/60 text-xs font-mono text-[#38bdf8] flex items-center gap-1.5">
                    <Scan className="w-3.5 h-3.5 animate-pulse" />
                    <span>Neural Polygons Detected (2 Zones)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-[#182028]/90 px-2 py-0.5 rounded border border-emerald-500/30">
                    Confidence: 99.4%
                  </span>
                </div>

                {/* Simulated polygon segmentation boxes */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-[20%] left-[28%] w-[45%] h-[38%] border-2 border-dashed border-[#38bdf8] bg-[#38bdf8]/15 rounded-lg flex items-start justify-end p-2 animate-pulse">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b141c]/80 text-[10px] font-mono text-[#38bdf8] border border-[#38bdf8]/40">
                      Zone 1: Upper Cabinets (8.4 m²)
                    </span>
                  </div>
                  <div className="absolute bottom-[10%] left-[18%] w-[64%] h-[30%] border-2 border-dashed border-[#bdc2ff] bg-[#bdc2ff]/15 rounded-lg flex items-end justify-start p-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b141c]/80 text-[10px] font-mono text-[#bdc2ff] border border-[#bdc2ff]/40">
                      Zone 2: Island Countertop (4.2 m²)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#bdc8d1] bg-[#182028]/90 px-3 py-1.5 rounded-lg border border-[#3e484f]/60 self-start">
                  Surface Plane: Normal Vector [0.00, 0.98, 0.18] • Perspective Angle: 34.2°
                </div>
              </div>
            )}

            {/* Step 1 Overlay: PBR Texture & Normal Mapping */}
            {activeFeatureStep === 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#38bdf8]/10 to-transparent flex flex-col justify-between p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-md bg-[#182028]/90 border border-[#38bdf8] text-xs font-mono text-[#38bdf8] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>PBR Shader: Micro-Emboss &amp; Normal Map Vector Blend</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#dae3ee] bg-[#182028]/90 px-2 py-0.5 rounded border border-[#3e484f]">
                    Roughness: 82% • Specular: 15%
                  </span>
                </div>

                {/* Macro Texture Grid Overlay */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto max-w-2xl mx-auto w-full">
                  <div className="bg-[#182028]/90 border border-[#38bdf8]/60 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-[#87929a] block">Albedo Map</span>
                    <span className="text-xs font-semibold text-[#dae3ee]">Japanese Ash SPW-01</span>
                  </div>
                  <div className="bg-[#182028]/90 border border-[#38bdf8]/60 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-[#87929a] block">Normal Height</span>
                    <span className="text-xs font-semibold text-[#dae3ee]">0.2mm Pore Emboss</span>
                  </div>
                  <div className="bg-[#182028]/90 border border-[#38bdf8]/60 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-[#87929a] block">Grain Direction</span>
                    <span className="text-xs font-semibold text-[#dae3ee]">Vertical 0°</span>
                  </div>
                  <div className="bg-[#182028]/90 border border-[#38bdf8]/60 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-[#87929a] block">Specular Topcoat</span>
                    <span className="text-xs font-semibold text-[#dae3ee]">Calacatta Gloss 88%</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#38bdf8] bg-[#182028]/90 px-3 py-1.5 rounded-lg border border-[#38bdf8]/40 self-end">
                  Anisotropic Highlights Synchronized to Window Illuminance
                </div>
              </div>
            )}

            {/* Step 2 Overlay: Photorealistic Studio Render */}
            {activeFeatureStep === 2 && (
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-[#0b141c]/60 via-transparent to-[#0b141c]/30">
                <div className="flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500 text-xs font-mono text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Final Composite: 4K UHD Ray-Preserved</span>
                  </div>
                  <button
                    onClick={onNavigateToStudio}
                    className="px-3 py-1 rounded-lg bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] text-xs font-bold transition-colors flex items-center gap-1 shadow-md shadow-[#38bdf8]/20"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3 bg-[#182028]/90 backdrop-blur-md rounded-xl border border-[#3e484f]/60 max-w-md self-start">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#dae3ee]">Active Applied Wrap Combo</span>
                    <span className="text-[10px] font-mono text-[#38bdf8]">Japandi Style</span>
                  </div>
                  <p className="text-[11px] text-[#bdc8d1]">
                    Japanese Ash (SPW-01) Super Matt Cabinetry + Calacatta Gloss (RM001) Waterfall Island.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Featured Collections Reel (Horizontal Snap-Scroll Row with Texture Swatches) */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto my-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
              <span className="text-[11px] font-mono text-[#87929a] uppercase tracking-widest block">
                Featured Collections Reel
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#dae3ee]">
              Master Vinyl Catalog Swatches
            </h2>
            <p className="text-xs sm:text-sm text-[#bdc8d1] mt-1">
              Tap any commercial finish swatch to inspect optical physical specifications or load directly into the studio workspace.
            </p>
          </div>

          <button
            onClick={onNavigateToCatalog}
            className="text-xs text-[#38bdf8] hover:text-[#8ed5ff] font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#182028] border border-[#3e484f]/40 hover:border-[#38bdf8]"
          >
            <span>Browse All 3,200+ Finishes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Snap-Scroll Swatch Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
          {reelMaterials.map((mat) => (
            <div
              key={mat.id}
              onClick={() => onOpenSpecsModal(mat)}
              className="min-w-[240px] sm:min-w-[260px] snap-start bg-[#141c24] rounded-2xl border border-[#3e484f]/40 hover:border-[#38bdf8]/60 p-3.5 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-[#38bdf8]/5 group"
            >
              <div>
                {/* Texture Swatch Image */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-[#0b141c]">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${mat.imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-[#0b141c]/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[11px] font-medium text-white flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#182028] border border-[#3e484f]">
                      <Eye className="w-3 h-3 text-[#38bdf8]" />
                      PBR Specs
                    </span>
                  </div>
                </div>

                {/* SKU Badge & Category */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-[#38bdf8] tracking-wider">
                    {mat.sku}
                  </span>
                  <span className="text-[10px] text-[#87929a] font-medium">
                    {mat.categoryName}
                  </span>
                </div>

                {/* Swatch Title */}
                <h3 className="font-semibold text-sm text-[#dae3ee] group-hover:text-white truncate mb-1.5">
                  {mat.name}
                </h3>

                {/* Tags */}
                <div className="flex items-center gap-1.5 text-[10px] text-[#bdc8d1]">
                  <span className="px-2 py-0.5 rounded bg-[#182028] border border-[#3e484f]/40">
                    {mat.finish}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#182028] text-emerald-400 border border-emerald-500/20">
                    Class A Fire
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 mt-3 border-t border-[#3e484f]/20 flex items-center justify-between text-[11px] text-[#87929a] group-hover:text-[#38bdf8] transition-colors">
                <span className="font-mono">Roughness: {Math.round(mat.pbr.roughness * 100)}%</span>
                <span className="font-semibold flex items-center gap-1">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Surface Selection Modal (Triggered Immediately Post-Upload) */}
      <TargetSurfaceModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        space={pendingSpace}
        onConfirmTarget={handleConfirmTarget}
      />
    </div>
  );
};

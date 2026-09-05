import React, { useState, useEffect } from 'react';
import { Material } from '../types';
import { Sparkles, Sun, RotateCw, Layers, X, ArrowRight } from 'lucide-react';

interface PbrModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyInStudio: (material: Material) => void;
}

export const PbrModal: React.FC<PbrModalProps> = ({
  material,
  isOpen,
  onClose,
  onApplyInStudio
}) => {
  const [lightAngle, setLightAngle] = useState(45);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b141c]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#182028] shadow-2xl rounded-2xl border border-[#3e484f]/60 overflow-hidden flex flex-col md:flex-row h-full max-h-[860px] animate-in fade-in zoom-in-95 duration-200 z-10">
        {/* Left: Large Macro PBR Texture Viewer */}
        <div className="w-full md:w-[58%] h-72 md:h-full bg-[#0b141c] relative overflow-hidden flex-shrink-0 group">
          {/* High-res texture with dynamic simulated light gloss */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
            style={{
              backgroundImage: `url(${material.macroUrl || material.imageUrl})`,
              transform: isRotating ? 'scale(1.1) rotate(5deg)' : 'scale(1)'
            }}
          />

          {/* Dynamic Light Rake Simulation Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-overlay opacity-50"
            style={{
              background: `linear-gradient(${lightAngle}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.6) 100%)`
            }}
          />

          {/* Simulated 3D lighting controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-[#182028]/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#3e484f]/40 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightAngle((prev) => (prev + 45) % 360)}
                className="w-8 h-8 rounded-lg bg-[#0b141c] flex items-center justify-center border border-[#3e484f]/60 text-[#dae3ee] hover:text-[#38bdf8] hover:border-[#38bdf8]/40 transition-colors"
                title="Shift Raking Light Angle"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsRotating((prev) => !prev)}
                className={`w-8 h-8 rounded-lg bg-[#0b141c] flex items-center justify-center border transition-colors ${
                  isRotating
                    ? 'border-[#38bdf8] text-[#38bdf8]'
                    : 'border-[#3e484f]/60 text-[#dae3ee] hover:text-[#38bdf8]'
                }`}
                title="360 Micro-Texture Scan"
              >
                <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <span className="font-mono text-[11px] text-[#87929a] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
              PBR Preview Active
            </span>
          </div>
        </div>

        {/* Right: PBR Specs & Details */}
        <div className="w-full md:w-[42%] flex flex-col h-full bg-[#222b33]/90 relative overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#182028] border border-[#3e484f]/60 text-[#dae3ee] hover:text-red-400 hover:border-red-400/40 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-[#38bdf8]/15 text-[#38bdf8] font-mono text-xs rounded border border-[#38bdf8]/30 font-semibold tracking-wider">
                  {material.sku}
                </span>
                <span className="px-2 py-0.5 bg-[#182028] text-[#87929a] text-xs rounded border border-[#3e484f]/30">
                  {material.categoryName}
                </span>
                {material.isPremium && (
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] rounded border border-amber-500/20 font-medium uppercase tracking-wider">
                    Premium
                  </span>
                )}
              </div>

              <h2 className="font-semibold text-2xl text-[#dae3ee] tracking-tight mb-2">
                {material.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#bdc8d1] leading-relaxed">
                {material.description}
              </p>
            </div>

            {/* PBR Specs Bento Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {/* Roughness */}
              <div className="bg-[#141c24] p-3 rounded-xl border border-[#3e484f]/30 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#87929a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">blur_on</span>
                  Roughness
                </span>
                <div className="flex items-end justify-between mt-1">
                  <span className="font-mono text-lg font-semibold text-[#dae3ee]">
                    {material.pbr.roughness.toFixed(2)}
                  </span>
                  <div className="w-14 h-1.5 bg-[#2d363e] rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-[#38bdf8]"
                      style={{ width: `${material.pbr.roughness * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Specular */}
              <div className="bg-[#141c24] p-3 rounded-xl border border-[#3e484f]/30 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#87929a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">flare</span>
                  Specular
                </span>
                <div className="flex items-end justify-between mt-1">
                  <span className="font-mono text-lg font-semibold text-[#dae3ee]">
                    {material.pbr.specular.toFixed(2)}
                  </span>
                  <div className="w-14 h-1.5 bg-[#2d363e] rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-[#bdc2ff]"
                      style={{ width: `${material.pbr.specular * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Normal Map */}
              <div className="bg-[#141c24] p-3 rounded-xl border border-[#3e484f]/30 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#87929a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">texture</span>
                  Normal Map
                </span>
                <span className="text-xs font-medium text-[#dae3ee] mt-1">
                  {material.pbr.normalMap}
                </span>
              </div>

              {/* Grain Direction */}
              <div className="bg-[#141c24] p-3 rounded-xl border border-[#3e484f]/30 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#87929a] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">line_weight</span>
                  Grain Align
                </span>
                <span className="text-xs font-medium text-[#dae3ee] mt-1">
                  {material.pbr.grainDirection}
                </span>
              </div>
            </div>

            {/* Physical Specifications List */}
            <div className="mb-6">
              <h4 className="text-[11px] font-semibold text-[#87929a] uppercase tracking-widest mb-2.5 border-b border-[#3e484f]/40 pb-1">
                Physical Specifications
              </h4>
              <ul className="flex flex-col gap-2 text-xs">
                <li className="flex justify-between py-1 border-b border-[#3e484f]/20 hover:bg-[#2d363e]/40 px-1 rounded transition-colors">
                  <span className="text-[#bdc8d1]">Thickness</span>
                  <span className="font-mono text-[#dae3ee] font-medium">{material.pbr.thickness}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-[#3e484f]/20 hover:bg-[#2d363e]/40 px-1 rounded transition-colors">
                  <span className="text-[#bdc8d1]">Roll Width</span>
                  <span className="font-mono text-[#dae3ee] font-medium">{material.pbr.rollWidth}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-[#3e484f]/20 hover:bg-[#2d363e]/40 px-1 rounded transition-colors">
                  <span className="text-[#bdc8d1]">Adhesive Core</span>
                  <span className="font-mono text-[#dae3ee] font-medium">{material.pbr.adhesive}</span>
                </li>
                {material.pbr.fireRating && (
                  <li className="flex justify-between py-1 border-b border-[#3e484f]/20 hover:bg-[#2d363e]/40 px-1 rounded transition-colors">
                    <span className="text-[#bdc8d1]">Fire Retardancy</span>
                    <span className="font-mono text-emerald-400 font-medium">{material.pbr.fireRating}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-[#3e484f]/40 flex gap-3">
              <button
                onClick={() => {
                  onApplyInStudio(material);
                  onClose();
                }}
                className="w-full px-5 py-3 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] rounded-xl font-semibold text-sm shadow-lg shadow-[#38bdf8]/20 hover:shadow-[#38bdf8]/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Try in Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

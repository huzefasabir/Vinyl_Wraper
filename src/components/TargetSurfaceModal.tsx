import React, { useState } from 'react';
import { Layers, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import { SpaceImage } from '../types';

interface TargetSurfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceImage | null;
  onConfirmTarget: (targetName: string) => void;
}

export const TargetSurfaceModal: React.FC<TargetSurfaceModalProps> = ({
  isOpen,
  onClose,
  space,
  onConfirmTarget,
}) => {
  const [componentName, setComponentName] = useState('Kitchen Cabinets');

  if (!isOpen || !space) return null;

  const quickChips = [
    'Kitchen Cabinets',
    'Countertops',
    'Backsplash',
    'Wardrobes',
    'Accent Wall',
    'Custom Surface',
    'Door',
    'Floor'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (componentName.trim()) {
      onConfirmTarget(componentName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b141c]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#141c24] border border-[#3e484f]/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#3e484f]/40 flex items-center justify-between bg-[#182028]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#dae3ee]">Target Surface Selection</h3>
              <p className="text-xs text-[#bdc8d1]">Define the architectural component to wrap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#222b33] hover:bg-[#2d363e] text-[#87929a] hover:text-[#dae3ee] flex items-center justify-center transition-colors border border-[#3e484f]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Space Thumbnail Preview & Detection Info */}
          <div className="flex gap-4 p-3 rounded-xl bg-[#182028] border border-[#3e484f]/40 items-center">
            <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-[#0b141c] shrink-0 border border-[#3e484f]/60">
              <img
                src={space.thumbnailUrl || space.imageUrl}
                alt={space.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#38bdf8]/10 ring-1 ring-inset ring-[#38bdf8]/40" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-wider">Image Analyzed</span>
              </div>
              <h4 className="font-semibold text-xs text-[#dae3ee] truncate">{space.title}</h4>
              <p className="text-[11px] text-[#bdc8d1]">AI Perspective &amp; Plane Normal calibrated</p>
            </div>
          </div>

          {/* Form Input Field */}
          <div>
            <label className="block text-xs font-semibold text-[#dae3ee] mb-2">
              What component / surface do you want to wrap?
            </label>
            <div className="relative">
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="e.g., Upper Kitchen Cabinets, Marble Island, Desk Surface..."
                className="w-full bg-[#182028] border border-[#3e484f] focus:border-[#38bdf8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none shadow-inner transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Select Chips */}
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-[#87929a] mb-2">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => {
                const isSelected = componentName.toLowerCase() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setComponentName(chip)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8] font-semibold'
                        : 'bg-[#182028] border-[#3e484f]/60 text-[#bdc8d1] hover:text-[#dae3ee] hover:border-[#38bdf8]/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#38bdf8]" />}
                    <span>{chip}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer CTA */}
          <div className="pt-3 border-t border-[#3e484f]/40 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#222b33] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!componentName.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#8ed5ff] disabled:opacity-50 text-[#00354a] font-semibold text-xs transition-all shadow-lg shadow-[#38bdf8]/20 flex items-center gap-2"
            >
              <span>Continue to Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

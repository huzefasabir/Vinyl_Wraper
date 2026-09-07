import React, { useState, useRef } from 'react';
import { Layers, ArrowRight, X, Check, Loader2, Scan } from 'lucide-react';
import { SpaceImage } from '../types';
import { VisionSegmentationResult, startVolkaAnalysis } from '../services/api';
import { log } from '../services/logger';

interface TargetSurfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceImage | null;
  onConfirmTarget: (targetName: string, jobId?: string, visionResult?: VisionSegmentationResult) => void;
}

export const TargetSurfaceModal: React.FC<TargetSurfaceModalProps> = ({
  isOpen,
  onClose,
  space,
  onConfirmTarget,
}) => {
  const [componentName, setComponentName] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !space) return null;

  const quickChips = [
    'Cabinets',
    'Countertop',
    'Backsplash',
    'Wardrobe',
    'Wall',
    'Door',
    'Floor',
  ];

  // Main confirm — fires async HF job immediately with up to 3 attempts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = componentName.trim();
    if (!target || isLaunching) return;

    log.info('TargetModal', `User confirmed target surface: "${target}"`);
    log.hf('TargetModal', `Firing POST /api/volka-analyze — image: ${space.title}, prompt: "${target}"`);

    const originalPhoto = space.beforeImageUrl || space.imageUrl;
    setIsLaunching(true);
    let jobId: string | undefined;
    let attempt = 0;
    const MAX_ATTEMPTS = 3;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      try {
        setStatusMessage(
          attempt === 1
            ? `Sending image + "${target}" to Hugging Face Space...`
            : `Retrying HF Space connection (Attempt ${attempt} of ${MAX_ATTEMPTS})...`
        );
        const jobRes = await startVolkaAnalysis(
          originalPhoto,
          target,
          (space.title || 'room').replace(/\s+/g, '_') + '.jpg'
        );
        jobId = jobRes.job_id;
        log.ok('TargetModal', `HF job queued on attempt ${attempt} — job_id: ${jobId}`);
        setStatusMessage(`HF Space job started ✓ — detecting "${target}" in background...`);
        break;
      } catch (err: any) {
        const msg: string = err?.message ?? 'Unknown error';
        log.error('TargetModal', `startVolkaAnalysis attempt ${attempt} failed: ${msg}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((res) => setTimeout(res, 1200));
        } else {
          setStatusMessage(`⚠ HF Space analysis failed after 3 attempts. Please re-upload your image.`);
          setIsLaunching(false);
          setTimeout(() => {
            onClose();
          }, 2000);
          return;
        }
      }
    }

    setIsLaunching(false);
    log.info('TargetModal', `Proceeding to catalog — job_id: ${jobId ?? 'none'}`);
    onConfirmTarget(target, jobId, undefined);
  };

  const handleChipSelect = (chip: string) => {
    setComponentName(chip);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b141c]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#141c24] border border-[#3e484f]/60 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step Indicator Header */}
        <div className="bg-[#0e161e] px-6 py-2.5 border-b border-[#3e484f]/40 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#87929a]">
            <span className="text-[#38bdf8] font-bold">Step 2 of 4</span>
            <span>•</span>
            <span className="text-[#dae3ee]">Target Surface Selection &amp; AI Masking</span>
          </div>
          <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
            Hugging Face Model Active
          </span>
        </div>

        {/* Modal Header */}
        <div className="p-5 border-b border-[#3e484f]/40 flex items-center justify-between bg-[#182028]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#dae3ee]">Select Surface to Wrap</h3>
              <p className="text-xs text-[#bdc8d1]">Choose or enter the target component for AI segmentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLaunching}
            className="w-7 h-7 rounded-lg bg-[#222b33] hover:bg-[#2d363e] text-[#87929a] hover:text-[#dae3ee] flex items-center justify-center transition-colors border border-[#3e484f]/40 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* ── Compact image preview ── */}
          <div className="relative w-full rounded-xl overflow-hidden bg-[#0b141c] border border-[#3e484f]/50 aspect-video flex items-center justify-center">
            <img
              src={space.imageUrl}
              alt={space.title}
              className="w-full h-full object-cover"
            />
            {/* dim overlay + label */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b141c]/70 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-2 left-3 text-[10px] font-mono text-[#87929a]">
              {space.title}
            </span>
            {/* "Ready" badge */}
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#0b141c]/80 backdrop-blur-sm border border-[#3e484f]/50 rounded-md px-2 py-0.5 text-[10px] font-mono text-[#38bdf8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
              Ready for segmentation
            </span>
          </div>

          {/* Form Input Field */}
          <div>
            <label className="block text-xs font-semibold text-[#dae3ee] mb-2">
              Target Component / Surface Name:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="e.g., Kitchen Cabinets, Backsplash, Wardrobe Doors..."
                className="w-full bg-[#182028] border border-[#3e484f] focus:border-[#38bdf8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none shadow-inner transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Select Chips */}
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-[#87929a] mb-2">
              Common Surfaces (Tap to select)
            </span>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => {
                const isSelected = componentName.toLowerCase() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipSelect(chip)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8] font-semibold shadow-sm'
                      : 'bg-[#182028] border-[#3e484f]/60 text-[#bdc8d1] hover:text-[#dae3ee] hover:border-[#38bdf8]/40'
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#38bdf8]" />}
                    <span>{chip}</span>
                  </button>
                );
              })}
              {/* Custom chip — clears input so user can type freely */}
              <button
                type="button"
                onClick={() => {
                  setComponentName('');
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border bg-[#182028] border-dashed border-[#3e484f]/60 text-[#87929a] hover:text-[#dae3ee] hover:border-[#38bdf8]/40"
              >
                + Custom
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border flex items-center gap-2 ${statusMessage.startsWith('⚠')
              ? 'text-red-400 bg-red-950/40 border-red-500/30'
              : 'text-[#38bdf8] bg-[#182028] border-[#3e484f]/50'
              }`}>
              {statusMessage.startsWith('⚠')
                ? <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                : <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse flex-shrink-0" />
              }
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Modal Footer CTA */}
          <div className="pt-3 border-t border-[#3e484f]/40 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLaunching}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#222b33] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!componentName.trim() || isLaunching}
                className="px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#8ed5ff] disabled:opacity-50 text-[#00354a] font-semibold text-xs transition-all shadow-lg shadow-[#38bdf8]/20 flex items-center gap-2"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Starting HF Job...</span>
                  </>
                ) : !componentName.trim() ? (
                  <span>Enter a target surface above</span>
                ) : (
                  <>
                    <span>Confirm "{componentName.trim()}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

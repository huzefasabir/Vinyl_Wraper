import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRightLeft } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatioClass?: string;
  interactive?: boolean;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before (Outdated Finish)',
  afterLabel = 'After (Architectural Vinyl Wrap)',
  aspectRatioClass = 'aspect-[16/10]',
  interactive = true
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };

    const handleGlobalMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`relative w-full ${aspectRatioClass} rounded-xl overflow-hidden shadow-2xl border border-[#3e484f]/60 select-none group cursor-ew-resize bg-[#0b141c]`}
    >
      {/* Before Image (Base layer) */}
      <img
        src={beforeImage}
        alt="Original Space Before Wrap"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* After Image (Clipped layer) */}
      <div
        className="absolute inset-0 h-full overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={afterImage}
          alt="AI Wrapped Space After"
          className="absolute inset-0 h-full object-cover select-none pointer-events-none"
          style={{
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw',
            maxWidth: 'none'
          }}
        />
      </div>

      {/* Vertical Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-[#38bdf8] flex items-center justify-center z-20 shadow-[0_0_12px_rgba(56,189,248,0.7)] pointer-events-none -translate-x-1/2"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-[#38bdf8] border-2 border-[#0b141c] flex items-center justify-center shadow-lg shadow-black/60 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[#00354a] text-[18px] font-bold">
            swap_horiz
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10 bg-[#0b141c]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider text-[#dae3ee] border border-[#3e484f]/40 shadow-sm pointer-events-none">
        {beforeLabel}
      </div>

      <div
        className={`absolute top-3 right-3 z-10 bg-[#38bdf8]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider text-[#00354a] font-semibold border border-[#38bdf8]/50 shadow-sm pointer-events-none transition-opacity duration-200 ${
          sliderPos > 85 ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {afterLabel}
      </div>

      {/* Subtle Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0b141c]/70 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-[#bdc8d1] border border-[#3e484f]/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Drag slider to compare transformation
      </div>
    </div>
  );
};

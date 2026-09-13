import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { resolveImageUrl, RENDER_BACKEND_URL } from '../services/api';

interface CatalogImageProps {
  src?: string;
  alt: string;
  colorHex?: string;
  materialCode?: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
}

export const CatalogImage: React.FC<CatalogImageProps> = ({
  src,
  alt,
  colorHex = '#222b33',
  materialCode,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full aspect-video rounded-xl overflow-hidden bg-[#0b141c]',
  loading = 'lazy',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [attempt, setAttempt] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setAttempt(0);
    const resolved = resolveImageUrl(src);
    setCurrentSrc(resolved);
  }, [src]);

  const handleError = () => {
    if (attempt === 0 && src && src.startsWith('/api')) {
      // Direct fallback to Render backend endpoint if first resolved path fails
      const directRenderUrl = `${RENDER_BACKEND_URL}${src.startsWith('/') ? src : `/${src}`}`;
      setAttempt(1);
      setCurrentSrc(directRenderUrl);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  return (
    <div
      className={containerClassName}
      style={{ backgroundColor: colorHex || '#0b141c' }}
    >
      {/* Loading Shimmer & Spinner Indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 bg-[#0b141c]/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5 text-[#38bdf8]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px] font-mono font-medium text-[#87929a]">Loading image...</span>
          </div>
        </div>
      )}

      {/* Main Image */}
      {!hasError && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        /* Styled Material Swatch Fallback when image fails */
        <div
          className="w-full h-full flex flex-col items-center justify-center p-3 text-center border border-white/10"
          style={{
            background: colorHex
              ? `radial-gradient(circle at 30% 30%, ${colorHex}ff, ${colorHex}aa)`
              : 'linear-gradient(135deg, #182028 0%, #0b141c 100%)',
          }}
        >
          <Sparkles className="w-5 h-5 text-white/50 mb-1" />
          {materialCode && (
            <span className="text-xs font-mono font-bold text-white shadow-sm tracking-wider">
              {materialCode}
            </span>
          )}
          <span className="text-[10px] text-white/80 font-medium truncate max-w-full">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
};

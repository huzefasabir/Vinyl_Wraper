import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
import { PRESET_SPACES } from '../data/presetSpaces';
import { SpaceImage } from '../types';

interface DropZoneProps {
  onSelectSpace: (space: SpaceImage) => void;
  onOpenTargetModal?: (space: SpaceImage) => void;
  onNavigateToStudio?: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  onSelectSpace, 
  onOpenTargetModal,
  onNavigateToStudio 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|webp)$/i)) {
      setUploadError('Please upload a valid image file (JPG, PNG, or HEIC).');
      return;
    }

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds 20MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 90);
        setUploadProgress(percent);
      }
    };

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setUploadProgress(100);

      setTimeout(() => {
        const customSpace: SpaceImage = {
          id: 'custom-' + Date.now(),
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          type: 'custom',
          imageUrl: dataUrl,
          thumbnailUrl: dataUrl,
          aspectRatio: 16 / 9,
          beforeImageUrl: dataUrl,
          segments: [
            {
              id: 'seg-custom-surface-1',
              name: 'Primary Cabinetry Surface',
              defaultMaterialSku: 'SPW-01',
              boundingBox: { x: 0.25, y: 0.25, width: 0.5, height: 0.45 },
              renderParameters: {
                grainDirection: 0,
                roughness: 82,
                reflectivity: 15,
                textureScale: 1.0,
                ambientLight: 85
              }
            },
            {
              id: 'seg-custom-surface-2',
              name: 'Countertop / Flat Horizon',
              defaultMaterialSku: 'RM001',
              boundingBox: { x: 0.20, y: 0.55, width: 0.6, height: 0.35 },
              renderParameters: {
                grainDirection: 45,
                roughness: 12,
                reflectivity: 88,
                textureScale: 1.2,
                ambientLight: 90
              }
            }
          ]
        };

        setIsUploading(false);
        onSelectSpace(customSpace);
        if (onOpenTargetModal) {
          onOpenTargetModal(customSpace);
        } else if (onNavigateToStudio) {
          onNavigateToStudio();
        }
      }, 500);
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadError('Error reading file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handlePresetSelect = (type: 'kitchen' | 'bathroom' | 'office') => {
    const matched = PRESET_SPACES.find((s) => s.type === type) || PRESET_SPACES[0];
    onSelectSpace(matched);
    if (onOpenTargetModal) {
      onOpenTargetModal(matched);
    } else if (onNavigateToStudio) {
      onNavigateToStudio();
    }
  };

  return (
    <div className="w-full max-w-3xl relative group mx-auto">
      {/* Dynamic glow effect */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r from-[#38bdf8]/40 via-[#bdc2ff]/30 to-[#38bdf8]/40 rounded-2xl blur-xl transition-all duration-700 pointer-events-none ${
          isDragging || isUploading ? 'opacity-100 scale-102' : 'opacity-40 group-hover:opacity-85'
        }`}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative bg-[#141c24]/95 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[310px] cursor-pointer shadow-2xl ${
          isDragging
            ? 'border-[#38bdf8] bg-[#182028]'
            : 'border-[#3e484f] hover:border-[#38bdf8]/80 hover:bg-[#182028]/90'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/heic,.heic,.jpg,.jpeg,.png"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4 py-6 w-full max-w-xs text-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#38bdf8] animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#38bdf8]">
                {uploadProgress}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#dae3ee]">Mapping Room Geometry...</p>
              <p className="text-xs text-[#bdc8d1] mt-1">Detecting surfaces and surface normals</p>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#222b33] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#38bdf8] to-[#8ed5ff] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Upload Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-[#222b33] border border-[#3e484f]/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#38bdf8]/50 transition-all duration-300 ease-out shadow-lg shadow-black/40">
              <Upload className="w-7 h-7 text-[#38bdf8]" />
            </div>

            <h3 className="font-semibold text-xl text-[#dae3ee] mb-1">
              Drag &amp; Drop Space Photo
            </h3>
            <p className="text-xs sm:text-sm text-[#bdc8d1] mb-6 text-center">
              or click to browse from your device (JPG, PNG, HEIC up to 20MB)
            </p>

            {uploadError && (
              <div className="mb-4 px-3 py-1.5 rounded-md bg-red-950/60 border border-red-800/50 text-red-200 text-xs">
                {uploadError}
              </div>
            )}

            {/* Quick Test Divider */}
            <div className="flex items-center gap-3 w-full justify-center opacity-75 group-hover:opacity-100 transition-opacity">
              <div className="h-px bg-[#3e484f] flex-1 max-w-[90px]" />
              <span className="text-[11px] font-semibold text-[#87929a] tracking-wider uppercase">
                Or test with preset spaces
              </span>
              <div className="h-px bg-[#3e484f] flex-1 max-w-[90px]" />
            </div>

            {/* Preset Buttons */}
            <div
              className="flex flex-wrap items-center justify-center gap-2.5 mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handlePresetSelect('kitchen')}
                className="px-3.5 py-1.5 bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 hover:border-[#38bdf8]/50 rounded-lg text-xs font-medium text-[#dae3ee] hover:text-[#38bdf8] transition-all flex items-center gap-1.5 shadow-sm group/btn"
              >
                <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                  kitchen
                </span>
                <span>Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('bathroom')}
                className="px-3.5 py-1.5 bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 hover:border-[#38bdf8]/50 rounded-lg text-xs font-medium text-[#dae3ee] hover:text-[#38bdf8] transition-all flex items-center gap-1.5 shadow-sm group/btn"
              >
                <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                  bathtub
                </span>
                <span>Bathroom</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('office')}
                className="px-3.5 py-1.5 bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 hover:border-[#38bdf8]/50 rounded-lg text-xs font-medium text-[#dae3ee] hover:text-[#38bdf8] transition-all flex items-center gap-1.5 shadow-sm group/btn"
              >
                <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                  desk
                </span>
                <span>Office</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

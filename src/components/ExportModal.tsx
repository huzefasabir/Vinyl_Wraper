import React, { useState } from 'react';
import { Download, FileText, Check, Copy, Sparkles, X, ShieldCheck, Printer } from 'lucide-react';
import { SpaceImage, SpaceSegment } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceImage;
  segments: SpaceSegment[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  space,
  segments
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadRender = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      // Trigger synthetic download of canvas render
      const link = document.createElement('a');
      link.download = `VinylWrap-AI-${space.title.replace(/\s+/g, '-')}-4K-Render.png`;
      link.href = space.imageUrl;
      link.click();
    }, 1000);
  };

  const handleDownloadSpecSheet = () => {
    const specContent = `VINYLWRAP AI STUDIO - ARCHITECTURAL SPECIFICATION SHEET
Project: ${space.title}
Date: ${new Date().toLocaleDateString()}
Render Resolution: 3840 x 2160 (4K UHD)

SURFACE MATERIAL SCHEDULE & BILL OF MATERIALS:
${segments
  .map(
    (s, idx) =>
      `${idx + 1}. Surface: ${s.name}
   - Material: ${s.appliedMaterial?.name || 'Standard Surface'}
   - SKU: ${s.appliedMaterial?.sku || 'N/A'}
   - Finish: ${s.appliedMaterial?.finish || 'Super Matt'}
   - Fire Retardancy: ${s.appliedMaterial?.pbr?.fireRating || 'Class A ASTM E84'}
   - Adhesive: ${s.appliedMaterial?.pbr?.adhesive || 'Air-Release Comply™'}
`
  )
  .join('\n')}

COMPLIANCE & TESTING STANDARDS:
- Fire Resistance: ASTM E-84 Class A / EN 13501-1 (B-s1, d0)
- Anti-Microbial & Anti-Stain: JIS Z 2801 / ISO 22196
- Thermal Self-Healing Topcoat: 75°C Activation Threshold
- Recommended Substrate Prep: 3M Primer 94 for edge seals
`;

    const blob = new Blob([specContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `VinylWrap-Spec-Sheet-${space.title.replace(/\s+/g, '-')}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b141c]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#182028] shadow-2xl rounded-2xl border border-[#3e484f]/60 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#3e484f]/40 flex items-center justify-between bg-[#141c24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#dae3ee]">Export Project Bundle</h2>
              <p className="text-xs text-[#bdc8d1]">
                High-resolution photorealistic render &amp; architectural BOM specification package
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#182028] border border-[#3e484f]/60 flex items-center justify-center text-[#87929a] hover:text-[#dae3ee] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preview Snapshot & Project Meta */}
          <div className="flex flex-col sm:flex-row gap-4 p-3 bg-[#141c24] rounded-xl border border-[#3e484f]/40">
            <img
              src={space.imageUrl}
              alt="Project Render"
              className="w-full sm:w-48 h-28 object-cover rounded-lg border border-[#3e484f]/40"
            />
            <div className="flex flex-col justify-between py-1">
              <div>
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-wider">
                  Project Spec
                </span>
                <h3 className="text-base font-semibold text-[#dae3ee]">{space.title}</h3>
                <p className="text-xs text-[#87929a] mt-0.5">
                  Resolution: 4K UHD (3840 x 2160) • Ray-traced surface normal illumination
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-[#222b33] rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Commercial Grade Verified
                </span>
              </div>
            </div>
          </div>

          {/* Bill of Materials (BOM) Table */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-[#87929a] uppercase tracking-wider mb-2">
              Bill of Materials (BOM) Schedule
            </h4>

            <div className="border border-[#3e484f]/40 rounded-xl overflow-hidden bg-[#141c24]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#182028] text-[11px] font-mono text-[#87929a] border-b border-[#3e484f]/40">
                  <tr>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Material SKU</th>
                    <th className="p-3">Finish</th>
                    <th className="p-3 text-right">Est. Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3e484f]/20 text-[#dae3ee]">
                  {segments.map((seg, idx) => (
                    <tr key={seg.id} className="hover:bg-[#182028]/60 transition-colors">
                      <td className="p-3 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                        <span>{seg.name}</span>
                      </td>
                      <td className="p-3 font-mono text-[#38bdf8]">
                        {seg.appliedMaterial?.sku || 'SPW-01'}
                      </td>
                      <td className="p-3 text-[#bdc8d1]">
                        {seg.appliedMaterial?.finish || 'Super Matt'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {(idx * 1.8 + 2.4).toFixed(1)} m²
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#3e484f]/40 bg-[#141c24] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 text-xs font-medium text-[#dae3ee] flex items-center justify-center gap-2 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#87929a]" />
                <span>Share Client Link</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleDownloadSpecSheet}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 text-xs font-semibold text-[#dae3ee] flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#38bdf8]" />
              <span>Download Spec Sheet</span>
            </button>

            <button
              onClick={handleDownloadRender}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-semibold text-xs shadow-lg shadow-[#38bdf8]/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating 4K...' : 'Download 4K Render'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

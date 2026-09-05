import React from 'react';
import { RotateCcw, RotateCw, X } from 'lucide-react';
import { StudioTool, SubNavSection, SpaceSegment } from '../types';

interface LeftStudioToolbarProps {
  activeTool: StudioTool;
  onSelectTool: (tool: StudioTool) => void;
  activeSection: SubNavSection;
  onSelectSection: (section: SubNavSection) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  segments: SpaceSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  onWrapSomethingElse?: () => void;
  onClosePanel?: () => void;
}

export const LeftStudioToolbar: React.FC<LeftStudioToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeSection,
  onSelectSection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  segments,
  selectedSegmentId,
  onSelectSegment,
  onWrapSomethingElse,
  onClosePanel,
}) => {
  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      className="w-64 lg:w-72 bg-[#0b141c] border-r border-[#3e484f]/40 flex h-full overflow-hidden select-none"
    >
      {/* 1. Main Drawer Area */}
      <div className="flex-1 flex flex-col justify-between p-4 border-r border-[#3e484f]/20 overflow-hidden">
        {/* Header & Controls Top Section */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Section title & close button */}
          <div className="mb-3 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] font-mono font-semibold text-[#87929a] uppercase tracking-widest">
              Studio Tools
            </span>
            {onClosePanel && (
              <button
                onClick={onClosePanel}
                className="p-1 rounded-lg hover:bg-[#222b33] text-[#87929a] hover:text-[#dae3ee] transition-colors"
                title="Close Tools Panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Wrap Something Else Action CTA */}
          <button
            onClick={onWrapSomethingElse}
            className="w-full py-2.5 px-3 bg-[#141c24] hover:bg-[#38bdf8] hover:text-[#00354a] text-[#38bdf8] rounded-xl font-bold text-xs border border-[#38bdf8]/40 hover:border-[#38bdf8] transition-all flex items-center justify-center gap-2 shadow-md mb-4 flex-shrink-0 group"
            title="Select another surface component in this room photo to wrap"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">add_circle</span>
            <span>Wrap Something Else</span>
          </button>

          {/* Wrap Layers Header */}
          <div className="flex items-center justify-between px-1 mb-2.5 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#38bdf8]">
              <span className="material-symbols-outlined text-[18px]">layers</span>
              <span>Extracted Surfaces</span>
            </div>
            <span className="text-[10px] font-mono bg-[#222b33] px-1.5 py-0.5 rounded text-[#87929a]">
              {segments.length}
            </span>
          </div>

          {/* Scrollable Extracted Components List */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain pr-1 flex flex-col gap-1.5">
            {segments.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-[#141c24]/50 border border-[#3e484f]/20 text-[11px] text-[#87929a]">
                No surfaces extracted yet. Click "Wrap Something Else" to select a surface component.
              </div>
            ) : (
              segments.map((seg) => {
                const isSelected = selectedSegmentId === seg.id;
                return (
                  <div
                    key={seg.id}
                    onClick={() => onSelectSegment(seg.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected
                      ? 'bg-[#182028] border-[#38bdf8] text-[#38bdf8] shadow-sm shadow-[#38bdf8]/10'
                      : 'bg-[#141c24]/90 border-[#3e484f]/30 hover:border-[#38bdf8]/40 text-[#dae3ee]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className="w-4 h-4 rounded-md border border-[#3e484f] flex-shrink-0"
                        style={{
                          backgroundColor: seg.appliedMaterial?.colorHex || '#222b33'
                        }}
                      />
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate text-[#dae3ee]">{seg.name}</span>
                          {seg.confidence && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                              {Math.round(seg.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#87929a] truncate">
                          {seg.appliedMaterial ? `${seg.appliedMaterial.sku} (${seg.appliedMaterial.name})` : 'Ready to wrap'}
                        </span>
                      </div>
                    </div>

                    {seg.appliedMaterial ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono text-[#87929a] group-hover:text-[#38bdf8] shrink-0">Select</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom CTA in Left Column: Export Render */}
        <div className="pt-4 border-t border-[#3e484f]/30 flex-shrink-0">
          <button
            onClick={onExport}
            className="w-full py-2.5 px-3 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] rounded-lg font-semibold text-xs shadow-lg shadow-[#38bdf8]/15 hover:shadow-[#38bdf8]/35 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span>Export Render</span>
          </button>
        </div>
      </div>
    </aside>
  );
};


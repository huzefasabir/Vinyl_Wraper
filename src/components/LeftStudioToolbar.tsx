import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
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
}) => {
  return (
    <aside className="w-64 lg:w-72 bg-[#0b141c] border-r border-[#3e484f]/40 flex h-full select-none">
      {/* 1. Sub-nav strip (Studio Tools Drawer) */}
      <div className="w-full flex flex-col justify-between p-4 border-r border-[#3e484f]/20">
        <div>
          {/* Section title */}
          <div className="mb-4">
            <span className="text-[11px] font-mono font-semibold text-[#87929a] uppercase tracking-widest">
              Studio Tools
            </span>
          </div>

          {/* Sub-nav items */}
          <div className="flex flex-col gap-1.5 mb-6">
            <button
              onClick={() => onSelectSection('layers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'layers'
                  ? 'bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/30 shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#141c24]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">layers</span>
                <span>Wrap Layers</span>
              </div>
              <span className="text-[10px] font-mono bg-[#222b33] px-1.5 py-0.5 rounded text-[#87929a]">
                {segments.length}
              </span>
            </button>

            <button
              onClick={() => onSelectSection('materials')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'materials'
                  ? 'bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/30 shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#141c24]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">texture</span>
                <span>Materials</span>
              </div>
            </button>

            <button
              onClick={() => onSelectSection('graphics')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'graphics'
                  ? 'bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/30 shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#141c24]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">branding_watermark</span>
                <span>Graphics</span>
              </div>
            </button>

            <button
              onClick={() => onSelectSection('environment')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === 'environment'
                  ? 'bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/30 shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#141c24]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                <span>Environment</span>
              </div>
            </button>
          </div>

          {/* Extracted Components (Vision Pipeline) */}
          {activeSection === 'layers' && (
            <div className="flex flex-col gap-3">
              {/* Components List Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-[#87929a] uppercase tracking-wider">
                  Extracted Surfaces ({segments.length})
                </span>
              </div>

              {/* Components List */}
              <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-1">
                {segments.map((seg) => {
                  const isSelected = selectedSegmentId === seg.id;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => onSelectSegment(seg.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
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
                })}
              </div>
            </div>
          )}

          {activeSection === 'environment' && (
            <div className="p-3 bg-[#141c24] rounded-lg border border-[#3e484f]/30 flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#dae3ee]">Lighting Simulation</span>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-[#bdc8d1]">
                  <span>Ambient Occlusion</span>
                  <span className="font-mono text-[#38bdf8]">92%</span>
                </div>
                <div className="w-full h-1 bg-[#222b33] rounded-full">
                  <div className="w-[92%] h-full bg-[#38bdf8]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-[#bdc8d1]">
                  <span>Color Temp</span>
                  <span className="font-mono text-[#bdc2ff]">3200K Warm</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA in Left Column: Export Render */}
        <div className="pt-4 border-t border-[#3e484f]/30">
          <button
            onClick={onExport}
            className="w-full py-2.5 px-3 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] rounded-lg font-semibold text-xs shadow-lg shadow-[#38bdf8]/15 hover:shadow-[#38bdf8]/35 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span>Export Render</span>
          </button>
        </div>
      </div>

      {/* 2. Micro Icon Tool Strip (matching screenshot vertical dark strip) */}
      <div className="w-14 bg-[#141c24] border-l border-[#3e484f]/30 flex flex-col justify-between items-center py-4">
        {/* Top Tools */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5">
          {/* Tool: Layers / Select */}
          <button
            onClick={() => onSelectTool('layers')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'layers'
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
            title="Layer Surface Selector"
          >
            <span className="material-symbols-outlined text-[20px]">layers</span>
          </button>

          {/* Tool: Brush Tool */}
          <button
            onClick={() => onSelectTool('brush')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'brush'
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
            title="Brush Mask Painter"
          >
            <span className="material-symbols-outlined text-[20px]">brush</span>
          </button>

          {/* Tool: Eraser */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'eraser'
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
            title="Mask Eraser"
          >
            <span className="material-symbols-outlined text-[20px]">ink_eraser</span>
          </button>

          {/* Tool: Polygonal Lasso */}
          <button
            onClick={() => onSelectTool('lasso')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'lasso'
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 shadow-sm'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
            title="Polygonal Lasso Boundary"
          >
            <span className="material-symbols-outlined text-[20px]">polyline</span>
          </button>
        </div>

        {/* Bottom Tools: Undo / Redo */}
        <div className="flex flex-col items-center gap-2 w-full px-1.5 pt-4 border-t border-[#3e484f]/30">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              canUndo
                ? 'text-[#dae3ee] hover:text-[#38bdf8] hover:bg-[#182028]'
                : 'text-[#3e484f] cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              canRedo
                ? 'text-[#dae3ee] hover:text-[#38bdf8] hover:bg-[#182028]'
                : 'text-[#3e484f] cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

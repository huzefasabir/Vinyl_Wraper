import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Sparkles, Check, Info } from 'lucide-react';
import { Material, RenderParameters } from '../types';
import { MATERIALS, CATEGORIES } from '../data/materialsData';

interface RightInspectorPanelProps {
  selectedMaterial: Material;
  onSelectMaterial: (material: Material) => void;
  renderParameters: RenderParameters;
  onChangeParameters: (params: RenderParameters) => void;
  onOpenSpecsModal: (material: Material) => void;
}

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  selectedMaterial,
  onSelectMaterial,
  renderParameters,
  onChangeParameters,
  onOpenSpecsModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategory, setOpenCategory] = useState<string>('Wood');
  const [openSubCategory, setOpenSubCategory] = useState<string>('optical-grain');

  const handleToggleCategory = (cat: typeof CATEGORIES[0]) => {
    if (openCategory === cat.name) {
      setOpenCategory('');
    } else {
      setOpenCategory(cat.name);
      if (cat.subCategories && cat.subCategories.length > 0) {
        setOpenSubCategory(cat.subCategories[0].id);
      } else {
        setOpenSubCategory('all');
      }
    }
  };

  const filteredMaterials = searchQuery
    ? MATERIALS.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subCategoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.finish.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : null;

  return (
    <aside className="w-80 lg:w-96 bg-[#0b141c] border-l border-[#3e484f]/40 flex flex-col h-full overflow-y-auto select-none">
      {/* 1. TOP SECTION: Details of the Selected Vinyl Style & Render Parameters */}
      <div className="p-4 border-b border-[#3e484f]/40 bg-[#141c24] space-y-3.5 flex-shrink-0">
        {/* Selected Material Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-[#87929a] uppercase tracking-widest">
            Selected Style Details
          </span>
          <span className="px-1.5 py-0.5 bg-[#38bdf8]/15 text-[#38bdf8] text-[9px] font-mono font-semibold rounded tracking-wider uppercase border border-[#38bdf8]/30">
            Active Film
          </span>
        </div>

        {/* Selected Material Card */}
        <div
          onClick={() => onOpenSpecsModal(selectedMaterial)}
          className="p-2.5 rounded-xl bg-[#182028] border border-[#3e484f]/50 flex items-center justify-between cursor-pointer hover:border-[#38bdf8]/50 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-13 h-13 rounded-lg bg-cover bg-center border border-[#3e484f]/40 flex-shrink-0 group-hover:scale-105 transition-transform bg-[#0b141c]"
              style={{ backgroundImage: `url(${selectedMaterial.imageUrl})` }}
            />
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-mono font-bold text-[#38bdf8] uppercase">
                {selectedMaterial.code || selectedMaterial.sku}
              </span>
              <span className="text-sm font-semibold text-[#dae3ee] truncate">
                {selectedMaterial.name}
              </span>
              <span className="text-[10px] text-[#87929a] truncate">
                {selectedMaterial.categoryName} • {selectedMaterial.finish}
              </span>
            </div>
          </div>

          <Info className="w-4 h-4 text-[#87929a] group-hover:text-[#38bdf8] transition-colors flex-shrink-0 mr-1" />
        </div>

        {/* Finish & Features Badges */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div>
            <span className="text-[9px] text-[#87929a] uppercase tracking-wider block">Finish</span>
            <span className="text-xs text-[#dae3ee] font-medium">{selectedMaterial.finish}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-[#87929a] uppercase tracking-wider block mb-0.5">
              Features
            </span>
            <div className="flex gap-1 justify-end">
              {selectedMaterial.isNew && (
                <span className="px-1.5 py-0.5 rounded bg-[#222b33] text-[9px] font-mono text-[#dae3ee] border border-[#3e484f]/40">
                  NEW
                </span>
              )}
              {selectedMaterial.isFireRetardant && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  FIRE RETARDANT
                </span>
              )}
              {!selectedMaterial.isNew && !selectedMaterial.isFireRetardant && (
                <span className="px-1.5 py-0.5 rounded bg-[#222b33] text-[9px] font-mono text-[#87929a]">
                  STANDARD
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Render Shader Parameters */}
        <div className="pt-3 border-t border-[#3e484f]/30 space-y-2.5">
          <span className="text-[10px] font-mono font-semibold text-[#87929a] uppercase tracking-widest block">
            Wrap Shader Parameters
          </span>

          {/* Grain Direction */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#bdc8d1]">Grain Angle</span>
            <div className="flex gap-1 bg-[#182028] p-0.5 rounded-md border border-[#3e484f]/40">
              <button
                type="button"
                onClick={() => onChangeParameters({ ...renderParameters, grainDirection: 0 })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${renderParameters.grainDirection === 0
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#87929a] hover:text-[#dae3ee]'
                  }`}
              >
                Vert (0°)
              </button>
              <button
                type="button"
                onClick={() => onChangeParameters({ ...renderParameters, grainDirection: 45 })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${renderParameters.grainDirection === 45
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#87929a] hover:text-[#dae3ee]'
                  }`}
              >
                45°
              </button>
              <button
                type="button"
                onClick={() => onChangeParameters({ ...renderParameters, grainDirection: 90 })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${renderParameters.grainDirection === 90
                  ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                  : 'text-[#87929a] hover:text-[#dae3ee]'
                  }`}
              >
                Horiz (90°)
              </button>
            </div>
          </div>

          {/* Roughness Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#bdc8d1]">Roughness</span>
              <span className="font-mono text-xs text-[#38bdf8]">
                {renderParameters.roughness}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={renderParameters.roughness}
              onChange={(e) =>
                onChangeParameters({ ...renderParameters, roughness: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-[#222b33] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
            />
          </div>

          {/* Reflectivity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#bdc8d1]">Reflectivity</span>
              <span className="font-mono text-xs text-[#38bdf8]">
                {renderParameters.reflectivity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={renderParameters.reflectivity}
              onChange={(e) =>
                onChangeParameters({ ...renderParameters, reflectivity: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-[#222b33] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
            />
          </div>
        </div>
      </div>

      {/* 2. BELOW SECTION: Materials Library & Other Categories */}
      <div className="p-4 border-b border-[#3e484f]/30 flex-shrink-0">
        <h3 className="font-semibold text-sm text-[#dae3ee] mb-2.5">
          Browse Categories ({MATERIALS.length} styles)
        </h3>

        <div className="relative">
          <Search className="w-4 h-4 text-[#87929a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, name, texture..."
            className="w-full bg-[#182028] border border-[#3e484f]/60 rounded-lg pl-9 pr-3 py-2 text-xs text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none focus:border-[#38bdf8] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#87929a] hover:text-[#dae3ee]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories Accordions / Search Results */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {filteredMaterials ? (
          <div>
            <span className="text-[10px] font-mono text-[#87929a] uppercase tracking-wider mb-2 block">
              Search Results ({filteredMaterials.length})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => onSelectMaterial(mat)}
                  className={`group relative bg-[#141c24] rounded-lg p-2 border cursor-pointer transition-all ${selectedMaterial.id === mat.id
                    ? 'border-[#38bdf8] shadow-md shadow-[#38bdf8]/10 bg-[#222b33]/40'
                    : 'border-[#3e484f]/30 hover:border-[#38bdf8]/40 hover:bg-[#222b33]/20'
                    }`}
                >
                  <div
                    className="w-full h-20 rounded mb-1.5 bg-cover bg-center bg-[#0b141c]"
                    style={{ backgroundImage: `url(${mat.imageUrl})` }}
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#38bdf8]">
                    <span>{mat.code || mat.sku}</span>
                    {selectedMaterial.id === mat.id && (
                      <Check className="w-3 h-3 text-[#38bdf8]" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-[#dae3ee] truncate">{mat.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const catMaterials = MATERIALS.filter((m) => m.category === cat.name || m.category === cat.id);
            const isOpen = openCategory === cat.name;

            return (
              <div key={cat.id} className="border border-[#3e484f]/40 rounded-xl overflow-hidden bg-[#141c24]">
                <button
                  onClick={() => handleToggleCategory(cat)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#dae3ee] hover:bg-[#182028] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="tracking-wider uppercase text-[11px]">{cat.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#222b33] text-[#87929a]">
                      {cat.count}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#87929a]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#87929a]" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-2.5 border-t border-[#3e484f]/20 bg-[#182028]/70 space-y-2.5">
                    {/* Sub-category chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setOpenSubCategory('all')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                          openSubCategory === 'all'
                            ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                            : 'bg-[#222b33] text-[#87929a] hover:text-[#dae3ee]'
                        }`}
                      >
                        All
                      </button>
                      {cat.subCategories?.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setOpenSubCategory(sub.id)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                            openSubCategory === sub.id
                              ? 'bg-[#38bdf8] text-[#00354a] font-semibold'
                              : 'bg-[#222b33] text-[#87929a] hover:text-[#dae3ee]'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>

                    {/* Material Cards */}
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-0.5">
                      {catMaterials
                        .filter((m) => openSubCategory === 'all' || m.subCategory.toLowerCase() === openSubCategory.toLowerCase())
                        .map((mat) => (
                          <div
                            key={mat.id}
                            onClick={() => onSelectMaterial(mat)}
                            className={`group relative bg-[#141c24] rounded-lg p-2 border cursor-pointer transition-all ${
                              selectedMaterial.id === mat.id
                                ? 'border-[#38bdf8] shadow-md shadow-[#38bdf8]/15 bg-[#222b33]/40'
                                : 'border-[#3e484f]/30 hover:border-[#38bdf8]/40 hover:bg-[#222b33]/20'
                            }`}
                          >
                            <div
                              className="w-full h-18 rounded mb-1.5 bg-cover bg-center bg-[#0b141c]"
                              style={{ backgroundImage: `url(${mat.imageUrl})` }}
                            />
                            <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-[#38bdf8]">
                              <span>{mat.code || mat.sku}</span>
                              {selectedMaterial.id === mat.id && (
                                <Check className="w-3 h-3 text-[#38bdf8]" />
                              )}
                            </div>
                            <div className="text-xs text-[#dae3ee] font-medium truncate">{mat.name}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

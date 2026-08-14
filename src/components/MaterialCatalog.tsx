import React, { useState } from 'react';
import { Search, Heart, SlidersHorizontal, Sparkles, Check, Eye, Layers, ArrowRight, RefreshCw, Edit3 } from 'lucide-react';
import { Material, SpaceImage } from '../types';
import { MATERIALS, CATEGORIES, SUB_CATEGORIES } from '../data/materialsData';

interface MaterialCatalogProps {
  activeSpace?: SpaceImage;
  targetComponent?: string;
  onChangeTargetOrSpace?: () => void;
  onSelectMaterialForStudio: (material: Material) => void;
  onOpenSpecsModal: (material: Material) => void;
}

export const MaterialCatalog: React.FC<MaterialCatalogProps> = ({
  activeSpace,
  targetComponent = 'Kitchen Cabinets',
  onChangeTargetOrSpace,
  onSelectMaterialForStudio,
  onOpenSpecsModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['spw-01', 'rm-001']);

  const allCategories = [
    { id: 'all', name: 'All Categories', count: 3204 },
    ...CATEGORIES
  ];

  const currentSubCategories = [
    { id: 'all', name: 'All Sub-finishes' },
    ...(selectedCategory !== 'all' && SUB_CATEGORIES[selectedCategory] ? SUB_CATEGORIES[selectedCategory] : [
      { id: 'oak-ash', name: 'Oak & Ash' },
      { id: 'walnut-teak', name: 'Walnut & Teak' },
      { id: 'calacatta', name: 'Calacatta Veins' },
      { id: 'super-matt', name: 'Super Matt Solids' },
      { id: 'brushed', name: 'Brushed Alloys' }
    ])
  ];

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const filteredMaterials = MATERIALS.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSub = subCategory === 'all' || m.subCategory === subCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.finish.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSub && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* 1. Active Project Context Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#141c24] via-[#182028] to-[#141c24] border border-[#38bdf8]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Uploaded space preview thumbnail */}
          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-[#0b141c] shrink-0 border border-[#3e484f]">
            <img
              src={activeSpace?.thumbnailUrl || activeSpace?.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeY9Vj8PDpu-0VphwfKJ8bfKDstbwmN8dT0QukCeUoROts61UpKYAy3r98thmuwyyff6jvqBf6lK48DxI7A7G7_CpsB_Wg8OzGyiUOm7dtIofuYZH-ffn0aG4z_2NrjNDaW824DFzdmKRyLQGzhz6cJs0EHaVDzoDTUHh-4omm7zQZx4xNwNanrHUNgMPTjyjRSGyRp5GenDYy5do-F7lam5EkkhrGkuziPdYFFrjHBGA3rQUKDHFA'}
              alt="Active Space Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-[#38bdf8]/50" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold">
                Active Session
              </span>
            </div>
            <div className="text-xs sm:text-sm text-[#dae3ee]">
              Target Surface: <span className="font-semibold text-white px-2 py-0.5 rounded bg-[#222b33] border border-[#3e484f]/60 font-mono text-xs">{targetComponent}</span> on <span className="text-[#bdc8d1]">{activeSpace?.title || 'Selected Space'}</span>
            </div>
          </div>
        </div>

        {/* Action button to switch image or edit target */}
        {onChangeTargetOrSpace && (
          <button
            onClick={onChangeTargetOrSpace}
            className="px-3 py-1.5 rounded-xl bg-[#222b33] hover:bg-[#2d363e] border border-[#3e484f] hover:border-[#38bdf8]/60 text-xs font-semibold text-[#dae3ee] hover:text-[#38bdf8] transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Switch Target / Image</span>
          </button>
        )}
      </div>

      {/* 2. Top Header & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae3ee] tracking-tight">
            Architectural Vinyl Library
          </h1>
          <p className="text-xs sm:text-sm text-[#bdc8d1] mt-1">
            Choose a commercial-grade wrap film below to apply directly to <span className="text-[#38bdf8] font-medium font-mono">{targetComponent}</span>.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#87929a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search textures, materials, or SKUs..."
            className="w-full bg-[#182028] border border-[#3e484f]/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none focus:border-[#38bdf8] shadow-inner transition-colors"
          />
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSubCategory('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
              selectedCategory === cat.id
                ? 'bg-[#38bdf8] text-[#00354a] font-semibold border-[#38bdf8] shadow-lg shadow-[#38bdf8]/20'
                : 'bg-[#182028] text-[#bdc8d1] hover:text-[#dae3ee] border-[#3e484f]/40 hover:border-[#38bdf8]/50'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                selectedCategory === cat.id ? 'bg-[#00354a]/20 text-[#00354a]' : 'bg-[#222b33] text-[#87929a]'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-[#3e484f]/30 scrollbar-none">
        {currentSubCategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSubCategory(sub.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              subCategory === sub.id
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 font-semibold'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* 4. Materials Grid with Primary CTA: "Apply to [Component] in Visualizer →" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredMaterials.map((mat) => {
          const isFav = favorites.includes(mat.id);

          return (
            <div
              key={mat.id}
              onClick={() => onOpenSpecsModal(mat)}
              className="group bg-[#141c24] rounded-2xl border border-[#3e484f]/40 hover:border-[#38bdf8]/60 p-3.5 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-[#38bdf8]/5"
            >
              <div>
                {/* Macro Texture Preview Container */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-[#0b141c]">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${mat.imageUrl})` }}
                  />

                  {/* NEW Badge */}
                  {mat.isNew && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#38bdf8] text-[#00354a] font-mono text-[10px] font-bold tracking-wider shadow">
                      NEW
                    </span>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(mat.id, e)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#0b141c]/70 backdrop-blur-md flex items-center justify-center text-[#dae3ee] hover:text-rose-400 transition-colors border border-[#3e484f]/40"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* View Specs Hover Button */}
                  <div className="absolute inset-0 bg-[#0b141c]/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1.5 rounded-lg bg-[#182028] text-xs font-semibold text-[#dae3ee] border border-[#3e484f] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                      View PBR Specs
                    </span>
                  </div>
                </div>

                {/* SKU & Category */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-[#38bdf8] tracking-wider">
                    {mat.sku}
                  </span>
                  <span className="text-[10px] text-[#87929a] font-medium">
                    {mat.categoryName}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base text-[#dae3ee] group-hover:text-white mb-2 truncate">
                  {mat.name}
                </h3>

                {/* Finish & Specs Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded bg-[#182028] text-[10px] text-[#bdc8d1] border border-[#3e484f]/40">
                    {mat.finish}
                  </span>
                  {mat.pbr.fireRating && (
                    <span className="px-2 py-0.5 rounded bg-[#182028] text-[10px] text-emerald-400 border border-emerald-500/20">
                      {mat.pbr.fireRating}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Primary CTA "Apply to [Component] in Visualizer →" */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMaterialForStudio(mat);
                }}
                className="w-full py-2.5 bg-[#182028] group-hover:bg-[#38bdf8] text-[#dae3ee] group-hover:text-[#00354a] font-semibold rounded-xl text-xs border border-[#3e484f]/50 group-hover:border-[#38bdf8] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Apply to {targetComponent} in Visualizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

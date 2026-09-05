import React, { useState, useEffect } from 'react';
import { Search, Heart, Sparkles, Eye, ArrowRight, Edit3, Flame, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Material, SpaceImage, CategorySummary, VolkaJobStatus } from '../types';
import { MATERIALS as DEFAULT_MATERIALS, CATEGORIES as DEFAULT_CATEGORIES, SUB_CATEGORIES as DEFAULT_SUB_CATEGORIES } from '../data/materialsData';
import { fetchCategories, fetchMaterials } from '../services/api';

interface MaterialCatalogProps {
  activeSpace?: SpaceImage;
  targetComponent?: string;
  onChangeTargetOrSpace?: () => void;
  onSelectMaterialForStudio: (material: Material) => void;
  onOpenSpecsModal: (material: Material) => void;
  volkaStatus?: VolkaJobStatus;
}

export const MaterialCatalog: React.FC<MaterialCatalogProps> = ({
  activeSpace,
  targetComponent = 'Kitchen Cabinets',
  onChangeTargetOrSpace,
  onSelectMaterialForStudio,
  onOpenSpecsModal,
  volkaStatus,
}) => {
  const [categories, setCategories] = useState<CategorySummary[]>(DEFAULT_CATEGORIES);
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Wood');
  const [subCategory, setSubCategory] = useState<string>('optical-grain');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  const [filterFireRetardantOnly, setFilterFireRetardantOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['ogw01', 'pm003', 'blc01']);

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [cats, mats] = await Promise.all([
          fetchCategories(),
          fetchMaterials()
        ]);
        if (isMounted) {
          if (cats && cats.length > 0) setCategories(cats);
          if (mats && mats.length > 0) setMaterials(mats);
        }
      } catch (err) {
        console.warn('Using default client materials data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalItemCount = materials.length;

  // Active Category Object
  const selectedCatObj = categories.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.id.toLowerCase() === selectedCategory.toLowerCase()
  ) || categories[0];

  // Active Sub-categories list for the selected category
  const currentSubCategories = selectedCatObj
    ? selectedCatObj.subCategories
    : (DEFAULT_SUB_CATEGORIES[selectedCategory] || []);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    const targetCat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase() || c.id.toLowerCase() === catName.toLowerCase());
    if (targetCat && targetCat.subCategories && targetCat.subCategories.length > 0) {
      // Automatically load the first sub-category of the chosen category
      setSubCategory(targetCat.subCategories[0].id);
    } else {
      setSubCategory('all');
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const filteredMaterials = materials.filter((m) => {
    // If searching, search across or within
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subCategoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.finish.toLowerCase().includes(searchQuery.toLowerCase());

    if (searchQuery.trim()) {
      const matchesNew = !filterNewOnly || m.isNew;
      const matchesFire = !filterFireRetardantOnly || m.isFireRetardant;
      return matchesSearch && matchesNew && matchesFire;
    }

    const matchesCat =
      selectedCategory === 'all' ||
      m.category.toLowerCase() === selectedCategory.toLowerCase() ||
      m.categoryName.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSub =
      subCategory === 'all' ||
      m.subCategory.toLowerCase() === subCategory.toLowerCase();

    const matchesNew = !filterNewOnly || m.isNew;
    const matchesFire = !filterFireRetardantOnly || m.isFireRetardant;

    return matchesCat && matchesSub && matchesNew && matchesFire;
  });

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] pt-18 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* 4-Step Flow Progress Bar */}
      <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-[#141c24] border border-[#3e484f]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="font-semibold">1. Image Upload</span>
        </div>
        <span className="text-[#3e484f] hidden sm:inline">→</span>
        <div className="flex items-center gap-2 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="font-semibold">2. Target: {targetComponent}</span>
        </div>
        <span className="text-[#3e484f] hidden sm:inline">→</span>
        <div className="flex items-center gap-2 text-[#38bdf8] font-bold bg-[#182028] px-3 py-1 rounded-lg border border-[#38bdf8]/40 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
          <span>3. Select Vinyl Style</span>
        </div>
        <span className="text-[#3e484f] hidden sm:inline">→</span>
        <div className="flex items-center gap-2 text-[#87929a]">
          <span>4. Visualizer Preview</span>
        </div>
      </div>

      {/* ── HF Space status banner ─────────────────────────────────────────── */}
      {volkaStatus === 'pending' && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#38bdf8]/8 border border-[#38bdf8]/30 text-xs">
          <Loader2 className="w-4 h-4 text-[#38bdf8] animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-[#38bdf8]">Segmentation running in background</span>
            <span className="text-[#87929a] ml-2">
              Volkopat/SegmentAnythingxGroundingDINO is processing <span className="text-[#dae3ee] font-mono">"{targetComponent}"</span> — pick a vinyl style while you wait.
            </span>
          </div>
          <div className="w-24 h-1 bg-[#222b33] rounded-full overflow-hidden flex-shrink-0">
            <div className="h-full w-full bg-gradient-to-r from-[#38bdf8]/40 via-[#38bdf8] to-[#38bdf8]/40 animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        </div>
      )}

      {volkaStatus === 'done' && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/30 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-emerald-400">Segmentation complete</span>
          <span className="text-[#87929a]">— the segmented image is ready in the visualizer.</span>
        </div>
      )}

      {volkaStatus === 'error' && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/30 text-xs">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-semibold text-red-400">Segmentation failed</span>
          <span className="text-[#87929a]">— the original image will be used in the visualizer. Check that the Python backend is running.</span>
        </div>
      )}

      {/* 1. Active Project Context Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#141c24] via-[#182028] to-[#141c24] border border-[#38bdf8]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-[#0b141c] shrink-0 border border-[#3e484f] shadow-inner">
            <img
              src={activeSpace?.hfSegmentedImage || activeSpace?.previewImage || activeSpace?.thumbnailUrl || activeSpace?.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeY9Vj8PDpu-0VphwfKJ8bfKDstbwmN8dT0QukCeUoROts61UpKYAy3r98thmuwyyff6jvqBf6lK48DxI7A7G7_CpsB_Wg8OzGyiUOm7dtIofuYZH-ffn0aG4z_2NrjNDaW824DFzdmKRyLQGzhz6cJs0EHaVDzoDTUHh-4omm7zQZx4xNwNanrHUNgMPTjyjRSGyRp5GenDYy5do-F7lam5EkkhrGkuziPdYFFrjHBGA3rQUKDHFA'}
              alt="Active Space Preview"
              className="w-full h-full object-cover"
            />
            {activeSpace?.hfSegmentedImage && (
              <div className="absolute inset-0 ring-2 ring-inset ring-emerald-400/60" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold">
                {activeSpace?.hfSegmentedImage ? 'Hugging Face Grounded-SAM Segmented' : 'Active Target Surface'}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-[#dae3ee]">
              Target Surface: <span className="font-semibold text-white px-2 py-0.5 rounded bg-[#222b33] border border-[#3e484f]/60 font-mono text-xs">{targetComponent}</span> on <span className="text-[#bdc8d1]">{activeSpace?.title || 'Selected Space'}</span>
            </div>
          </div>
        </div>

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
            Browse {totalItemCount} commercial-grade wrap films. Choose a style below to apply directly to <span className="text-[#38bdf8] font-medium font-mono">{targetComponent}</span>.
          </p>
        </div>

        {/* Search bar & quick filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-[#87929a] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU (e.g. OGW01), name, grain..."
              className="w-full bg-[#182028] border border-[#3e484f]/60 rounded-xl pl-10 pr-4 py-2 text-xs text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none focus:border-[#38bdf8] shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#87929a] hover:text-[#dae3ee]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterNewOnly(!filterNewOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterNewOnly
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]'
                  : 'bg-[#182028] text-[#87929a] border-[#3e484f]/40 hover:text-[#dae3ee]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>NEW</span>
            </button>

            <button
              onClick={() => setFilterFireRetardantOnly(!filterFireRetardantOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterFireRetardantOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-[#182028] text-[#87929a] border-[#3e484f]/40 hover:text-[#dae3ee]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Fire Retardant</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.name)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
              selectedCategory.toLowerCase() === cat.name.toLowerCase()
                ? 'bg-[#38bdf8] text-[#00354a] font-semibold border-[#38bdf8] shadow-lg shadow-[#38bdf8]/20'
                : 'bg-[#182028] text-[#bdc8d1] hover:text-[#dae3ee] border-[#3e484f]/40 hover:border-[#38bdf8]/50'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-[#00354a]/20 text-[#00354a]'
                  : 'bg-[#222b33] text-[#87929a]'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-[#3e484f]/30 scrollbar-none">
        <button
          onClick={() => setSubCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            subCategory === 'all'
              ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 font-semibold shadow-xs'
              : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
          }`}
        >
          <span>All {selectedCatObj?.name || 'Category'}</span>
        </button>

        {currentSubCategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSubCategory(sub.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              subCategory === sub.id
                ? 'bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/40 font-semibold shadow-xs'
                : 'text-[#87929a] hover:text-[#dae3ee] hover:bg-[#182028]'
            }`}
          >
            <span>{sub.name}</span>
            {'count' in sub && sub.count !== undefined && (
              <span className="text-[10px] opacity-70 font-mono">({sub.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Results count & active filters feedback */}
      <div className="flex items-center justify-between mb-4 text-xs text-[#87929a]">
        <span>
          Showing <strong className="text-[#dae3ee] font-mono">{filteredMaterials.length}</strong> styles
        </span>
        {(selectedCategory !== 'all' || subCategory !== 'all' || searchQuery || filterNewOnly || filterFireRetardantOnly) && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSubCategory('all');
              setSearchQuery('');
              setFilterNewOnly(false);
              setFilterFireRetardantOnly(false);
            }}
            className="text-[#38bdf8] hover:underline text-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 5. Materials Grid with Primary CTA: "Apply to [Component] in Visualizer →" */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#141c24]/60 rounded-2xl border border-[#3e484f]/40 flex flex-col items-center justify-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[24px]">search_off</span>
          </div>
          <h4 className="text-base font-bold text-[#dae3ee] mb-1">Vinyl style not found</h4>
          <p className="text-xs text-[#87929a] max-w-md">
            This style is currently unavailable. Please try again with another style.
          </p>
          {(selectedCategory !== 'all' || subCategory !== 'all' || searchQuery || filterNewOnly || filterFireRetardantOnly) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSubCategory('all');
                setSearchQuery('');
                setFilterNewOnly(false);
                setFilterFireRetardantOnly(false);
              }}
              className="mt-4 px-4 py-2 bg-[#182028] hover:bg-[#222b33] text-[#38bdf8] border border-[#38bdf8]/30 hover:border-[#38bdf8] rounded-xl text-xs font-semibold transition-all"
            >
              Reset Filters & View All
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMaterials.map((mat) => {
            const isFav = favorites.includes(mat.id) || favorites.includes(mat.code.toLowerCase());

            return (
              <div
                key={mat.id}
                onClick={() => onOpenSpecsModal(mat)}
                className="group bg-[#141c24] rounded-2xl border border-[#3e484f]/40 hover:border-[#38bdf8]/60 p-3.5 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-[#38bdf8]/5"
              >
                <div>
                  {/* Photo Texture Preview Container - ONLY {code}.jpg is shown */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-[#0b141c]">
                    <img
                      src={mat.imageUrl}
                      alt={`${mat.name} (${mat.code})`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // If specific image path failed, fallback to color gradient
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.style.backgroundColor = mat.colorHex || '#222b33';
                        }
                      }}
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
                      <span className="px-3 py-1.5 rounded-lg bg-[#182028] text-xs font-semibold text-[#dae3ee] border border-[#3e484f] flex items-center gap-1.5 shadow-lg">
                        <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                        View PBR Specs
                      </span>
                    </div>
                  </div>

                  {/* SKU & Category */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#38bdf8] tracking-wider">
                      {mat.code || mat.sku}
                    </span>
                    <span className="text-[10px] text-[#87929a] font-medium">
                      {mat.subCategoryName || mat.categoryName}
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
                    {mat.isFireRetardant && (
                      <span className="px-2 py-0.5 rounded bg-[#182028] text-[10px] text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" />
                        Fire Rated
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
                  <span>Apply to {targetComponent}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

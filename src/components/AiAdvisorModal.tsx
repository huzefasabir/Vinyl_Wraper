import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, Wand2, Lightbulb, ShieldCheck } from 'lucide-react';
import { Material } from '../types';
import { MATERIALS } from '../data/materialsData';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPalette: (materials: Material[]) => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  onApplyPalette
}) => {
  const [spaceType, setSpaceType] = useState('Modern Kitchen');
  const [roomVibe, setRoomVibe] = useState('Japandi Organic Minimal');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<any>({
    designTheme: 'Japandi Organic Harmony',
    paletteMood:
      'Warm natural ash wood grains balanced by anti-fingerprint chalk white solids and polished Calacatta veining.',
    recommendedSkus: ['SPW-01', 'PZ330', 'RM001'],
    zonePairings: [
      {
        zone: 'Upper Wall Cabinets',
        material: 'Japanese Ash Select (SPW-01)',
        finish: 'Super Matt',
        why: 'Deeply embossed micro-grain adds natural warmth without distracting specular glare under direct downlights.'
      },
      {
        zone: 'Waterfall Island Countertop',
        material: 'Calacatta Gloss (RM001)',
        finish: 'High Gloss',
        why: 'Creates a focal architectural centerpiece with continuous veining and self-healing thermal topcoat.'
      },
      {
        zone: 'Base Storage Units',
        material: 'Mono Blanc Matte (PZ330)',
        finish: 'Super Matt Solids',
        why: 'Zero-reflection anti-fingerprint surface provides seamless horizontal grounding.'
      }
    ],
    lightingTip:
      'Position LED strip lighting with 3000K warm white color temperature at a 45° angle to accentuate the tactile emboss.'
  });

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceType, roomVibe })
      });
      const data = await res.json();
      if (data.advisor) {
        setSuggestion(data.advisor);
      }
    } catch (e) {
      console.warn('AI Suggest API fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToStudio = () => {
    const matched = suggestion.recommendedSkus
      .map((sku: string) => MATERIALS.find((m) => m.sku === sku))
      .filter(Boolean) as Material[];

    if (matched.length > 0) {
      onApplyPalette(matched);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b141c]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-[#182028] shadow-2xl rounded-2xl border border-[#3e484f]/60 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#3e484f]/40 flex items-center justify-between bg-[#141c24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#bdc2ff] flex items-center justify-center text-[#00354a] shadow-lg shadow-[#38bdf8]/20">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#dae3ee]">AI Surface Harmony Stylist</h2>
              <p className="text-xs text-[#bdc8d1]">
                Generative architectural material pairing &amp; lighting synergy engine
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

        {/* Form & Output */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Controls row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#87929a] uppercase tracking-wider block mb-1.5">
                Room Architecture Type
              </label>
              <select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                className="w-full bg-[#141c24] border border-[#3e484f]/60 rounded-xl px-3 py-2 text-xs text-[#dae3ee] focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="Modern Kitchen">Modern Kitchen / Island</option>
                <option value="Luxury Bathroom">Luxury Bathroom &amp; Vanity</option>
                <option value="Executive Office">Executive Office &amp; Reception</option>
                <option value="Living Suite">Penthouse Living Suite</option>
                <option value="Commercial Retail">Boutique Commercial Retail</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#87929a] uppercase tracking-wider block mb-1.5">
                Aesthetic Archetype
              </label>
              <select
                value={roomVibe}
                onChange={(e) => setRoomVibe(e.target.value)}
                className="w-full bg-[#141c24] border border-[#3e484f]/60 rounded-xl px-3 py-2 text-xs text-[#dae3ee] focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="Japandi Organic Minimal">Japandi Organic Minimal</option>
                <option value="High-Contrast Luxury">High-Contrast Dark Luxury</option>
                <option value="Scandinavian Warmth">Scandinavian Pale Woods &amp; Mattes</option>
                <option value="Urban Industrial Slate">Urban Industrial Concrete &amp; Slate</option>
                <option value="Monochrome Brutalist">Monochrome Zero-Glare Brutalist</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateAI}
            disabled={isLoading}
            className="w-full py-2.5 bg-[#222b33] hover:bg-[#2d363e] border border-[#38bdf8]/40 hover:border-[#38bdf8] text-[#38bdf8] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Wand2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synthesizing Color Theory...' : 'Synthesize New Palette'}</span>
          </button>

          {/* AI Recommendation Result Box */}
          <div className="p-4 rounded-xl bg-[#141c24] border border-[#3e484f]/50 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-semibold text-[#38bdf8] uppercase tracking-wider">
                  {suggestion.designTheme}
                </span>
                <span className="px-2 py-0.5 bg-[#38bdf8]/10 text-[#38bdf8] rounded text-[10px] font-mono">
                  Curated Match
                </span>
              </div>
              <p className="text-xs text-[#dae3ee] leading-relaxed">{suggestion.paletteMood}</p>
            </div>

            {/* Zone pairings */}
            <div className="space-y-2 pt-2 border-t border-[#3e484f]/30">
              <span className="text-[10px] font-mono font-semibold text-[#87929a] uppercase tracking-wider block">
                Recommended Zone Allocations:
              </span>
              {suggestion.zonePairings?.map((zp: any, i: number) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#182028] border border-[#3e484f]/30 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#dae3ee] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      {zp.zone}
                    </span>
                    <span className="font-mono text-[10px] text-[#38bdf8]">{zp.finish}</span>
                  </div>
                  <div className="text-[11px] font-medium text-[#bdc2ff]">{zp.material}</div>
                  <div className="text-[10px] text-[#87929a]">{zp.why}</div>
                </div>
              ))}
            </div>

            {/* Lighting Tip */}
            {suggestion.lightingTip && (
              <div className="p-2.5 rounded-lg bg-[#0b141c] border border-amber-500/20 text-xs flex items-start gap-2 text-amber-200/90">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">{suggestion.lightingTip}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3e484f]/40 bg-[#141c24] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-[#bdc8d1] hover:text-[#dae3ee]"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyToStudio}
            className="px-5 py-2.5 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-semibold text-xs rounded-xl shadow-md shadow-[#38bdf8]/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Palette to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};

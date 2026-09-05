import React from 'react';
import { Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: 'landing' | 'visualizer' | 'catalog' | '404';
  onNavigate: (view: 'landing' | 'visualizer' | 'catalog' | '404') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#182028]/85 backdrop-blur-xl border-b border-[#3e484f]/40 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Brand & Nav */}
      <div className="flex items-center gap-6 sm:gap-10">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 group focus:outline-none text-left"
          title="VinylWrap AI Studio Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#8ed5ff] flex items-center justify-center shadow-lg shadow-[#38bdf8]/20 group-hover:shadow-[#38bdf8]/40 transition-all duration-300">
            <span className="material-symbols-outlined text-[#00354a] text-[20px] font-bold">
              layers
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg sm:text-xl tracking-tight text-[#dae3ee] group-hover:text-white transition-colors">
              Wrap <span className="text-[#38bdf8]">AI</span>
            </span>
          </div>
        </button>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'landing'
                ? 'text-[#38bdf8] bg-[#38bdf8]/10 font-semibold'
                : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#222b33]/50'
              }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('visualizer')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${currentView === 'visualizer'
                ? 'text-[#38bdf8] bg-[#38bdf8]/10 font-semibold'
                : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#222b33]/50'
              }`}
          >
            <span>Visualizer</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse"></span>
          </button>
          <button
            onClick={() => onNavigate('catalog')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'catalog'
                ? 'text-[#38bdf8] bg-[#38bdf8]/10 font-semibold'
                : 'text-[#bdc8d1] hover:text-[#dae3ee] hover:bg-[#222b33]/50'
              }`}
          >
            Catalog
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick studio jump if in landing or catalog */}
        {currentView !== 'visualizer' && (
          <button
            onClick={() => onNavigate('visualizer')}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-semibold text-xs transition-all shadow-md shadow-[#38bdf8]/20"
          >
            <span>Open Studio</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        )}

        {/* User profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#222b33] to-[#2d363e] border border-[#3e484f] flex items-center justify-center text-[#38bdf8] shadow-inner cursor-pointer hover:border-[#38bdf8]/50 transition-colors" title="Studio Account: Architect Pro">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};

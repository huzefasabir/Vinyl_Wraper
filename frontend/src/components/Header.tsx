import React, { useState } from 'react';
import { Layers, Sparkles, Menu, X, Home, Palette, Layers3, ArrowRight } from 'lucide-react';

interface HeaderProps {
  currentView: 'landing' | 'visualizer' | 'catalog' | '404';
  onNavigate: (view: 'landing' | 'visualizer' | 'catalog' | '404') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (view: 'landing' | 'visualizer' | 'catalog' | '404') => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#182028]/90 backdrop-blur-xl border-b border-[#3e484f]/40 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Brand & Nav */}
      <div className="flex items-center gap-4 sm:gap-10">
        {/* Mobile Hamburger Toggle (under md) */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#bdc8d1] hover:text-white hover:bg-[#222b33] transition-colors focus:outline-none"
          title={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-[#38bdf8]" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo */}
        <button
          onClick={() => handleMobileNav('landing')}
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

        {/* Desktop Navigation links (Unchanged for md and above) */}
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-semibold text-xs transition-all shadow-md shadow-[#38bdf8]/20"
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

      {/* Mobile Navigation Dropdown Menu (only renders on screens under md when opened) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-[#141c24]/95 backdrop-blur-2xl border-b border-[#3e484f]/60 p-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 flex flex-col gap-2">
          <button
            onClick={() => handleMobileNav('landing')}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${currentView === 'landing'
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                : 'text-[#dae3ee] hover:bg-[#182028]'
              }`}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-[#38bdf8]" />
              <span>Home</span>
            </div>
            {currentView === 'landing' && <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
          </button>

          <button
            onClick={() => handleMobileNav('visualizer')}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${currentView === 'visualizer'
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                : 'text-[#dae3ee] hover:bg-[#182028]'
              }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
              <span>AI Visualizer Studio</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#38bdf8]/20 text-[#38bdf8]">
              LIVE
            </span>
          </button>

          <button
            onClick={() => handleMobileNav('catalog')}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${currentView === 'catalog'
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                : 'text-[#dae3ee] hover:bg-[#182028]'
              }`}
          >
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-[#38bdf8]" />
              <span>Vinyl Catalog (450+ Finishes)</span>
            </div>
            {currentView === 'catalog' && <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />}
          </button>

          {currentView !== 'visualizer' && (
            <button
              onClick={() => handleMobileNav('visualizer')}
              className="w-full mt-2 py-3 px-4 bg-[#38bdf8] text-[#00354a] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#38bdf8]/20 flex items-center justify-center gap-2"
            >
              <span>Launch Studio Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};


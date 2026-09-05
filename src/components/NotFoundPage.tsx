import React from 'react';
import { AlertTriangle, Home, Sparkles, BookOpen, RefreshCw } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (view: 'landing' | 'visualizer' | 'catalog') => void;
  errorMessage?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, errorMessage }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b141c] flex items-center justify-center p-6 select-none font-sans">
      <div className="max-w-xl w-full bg-[#141c24]/90 backdrop-blur-xl border border-[#3e484f]/50 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 text-center relative overflow-hidden group">
        
        {/* Background ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Icon & Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 shadow-lg shadow-amber-500/5">
          <AlertTriangle className="w-10 h-10 animate-pulse" />
        </div>

        {/* Large 404 Heading */}
        <div className="mb-2">
          <span className="text-xs font-mono font-bold text-[#38bdf8] uppercase tracking-widest bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-3 py-1 rounded-full">
            Error 404 · Resource Not Found
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#dae3ee] tracking-tight mt-3 mb-3">
          Page or Resource Not Found
        </h1>

        <p className="text-sm text-[#87929a] leading-relaxed max-w-md mx-auto mb-6">
          The requested page, architectural texture swatch, or backend rendering resource could not be found or processed.
        </p>

        {/* Error Details Box if present */}
        {errorMessage && (
          <div className="mb-8 p-3.5 rounded-xl bg-[#182028] border border-[#3e484f]/40 text-left">
            <span className="text-[10px] font-mono text-[#87929a] uppercase block mb-1">Technical Details</span>
            <code className="text-xs font-mono text-amber-400 break-all block">{errorMessage}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-3 px-4 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] rounded-xl font-bold text-xs shadow-lg shadow-[#38bdf8]/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Home</span>
          </button>

          <button
            onClick={() => onNavigate('visualizer')}
            className="w-full py-3 px-4 bg-[#182028] hover:bg-[#222b33] text-[#dae3ee] hover:text-[#38bdf8] border border-[#3e484f]/60 hover:border-[#38bdf8]/50 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#38bdf8]" />
            <span>Open Studio Visualizer</span>
          </button>
        </div>

        {/* Extra Quick Links */}
        <div className="pt-6 border-t border-[#3e484f]/30 flex items-center justify-center gap-6 text-xs text-[#87929a]">
          <button
            onClick={() => onNavigate('catalog')}
            className="hover:text-[#38bdf8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </button>
          <span className="text-[#3e484f]">•</span>
          <button
            onClick={() => window.location.reload()}
            className="hover:text-[#38bdf8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </button>
        </div>

      </div>
    </div>
  );
};

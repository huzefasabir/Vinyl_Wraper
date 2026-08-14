import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { LeftStudioToolbar } from './components/LeftStudioToolbar';
import { StudioCanvas } from './components/StudioCanvas';
import { RightInspectorPanel } from './components/RightInspectorPanel';
import { MaterialCatalog } from './components/MaterialCatalog';
import { ProjectsView } from './components/ProjectsView';
import { PbrModal } from './components/PbrModal';
import { ExportModal } from './components/ExportModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { PRESET_SPACES } from './data/presetSpaces';
import { MATERIALS } from './data/materialsData';
import { SpaceImage, SpaceSegment, Material, RenderParameters, StudioTool, SubNavSection } from './types';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'landing' | 'visualizer' | 'catalog' | 'projects'>('landing');

  // Active space, segments & target component
  const [currentSpace, setCurrentSpace] = useState<SpaceImage>(PRESET_SPACES[0]);
  const [segments, setSegments] = useState<SpaceSegment[]>(PRESET_SPACES[0].segments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    PRESET_SPACES[0].segments[0]?.id || null
  );
  const [activeTargetComponent, setActiveTargetComponent] = useState<string>('Kitchen Cabinets');

  // Selected Material & Shader Parameters
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(MATERIALS[0]);
  const [renderParameters, setRenderParameters] = useState<RenderParameters>({
    grainDirection: 0,
    roughness: 82,
    reflectivity: 15,
    textureScale: 1.0,
    ambientLight: 85
  });

  // Active Studio Tools & Sub-nav
  const [activeTool, setActiveTool] = useState<StudioTool>('layers');
  const [activeSubSection, setActiveSubSection] = useState<SubNavSection>('layers');

  // History stack for Undo / Redo
  const [history, setHistory] = useState<SpaceSegment[][]>([PRESET_SPACES[0].segments]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals state
  const [inspectedMaterial, setInspectedMaterial] = useState<Material | null>(null);
  const [isPbrModalOpen, setIsPbrModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Push new state to history
  const pushHistory = (newSegments: SpaceSegment[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newSegments);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setSegments(history[prevIndex]);
      showToast('Undo applied');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setSegments(history[nextIndex]);
      showToast('Redo applied');
    }
  };

  // Load new space
  const handleSelectSpace = (space: SpaceImage) => {
    setCurrentSpace(space);
    setSegments(space.segments);
    setSelectedSegmentId(space.segments[0]?.id || null);
    setHistory([space.segments]);
    setHistoryIndex(0);
    showToast(`Loaded ${space.title}`);
  };

  // Post-upload target confirm flow: Sets space & target component, routes directly to catalog
  const handleConfirmTargetAndProceed = (space: SpaceImage, targetName: string) => {
    setCurrentSpace(space);
    setActiveTargetComponent(targetName);

    // If segment exists with matching or generic name, configure it
    const matchingSeg = space.segments.find(s => s.name.toLowerCase().includes(targetName.toLowerCase())) || space.segments[0];
    setSegments(space.segments);
    setSelectedSegmentId(matchingSeg?.id || null);
    setHistory([space.segments]);
    setHistoryIndex(0);

    showToast(`Target Set: "${targetName}" • Opening Vinyl Library`);
    setCurrentView('catalog');
  };

  // Apply material to a specific zone
  const handleApplyMaterialToSegment = (segmentId: string, material: Material) => {
    const nextSegments = segments.map((seg) => {
      if (seg.id === segmentId) {
        return {
          ...seg,
          appliedMaterial: material,
          renderParameters: {
            ...seg.renderParameters,
            roughness: Math.round(material.pbr.roughness * 100),
            reflectivity: Math.round(material.pbr.specular * 100)
          }
        };
      }
      return seg;
    });

    setSegments(nextSegments);
    pushHistory(nextSegments);
    showToast(`Applied ${material.sku} (${material.name}) to ${activeTargetComponent}`);
  };

  // Quick apply material to currently selected zone
  const handleQuickApplyMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setRenderParameters((prev) => ({
      ...prev,
      roughness: Math.round(material.pbr.roughness * 100),
      reflectivity: Math.round(material.pbr.specular * 100)
    }));

    if (selectedSegmentId) {
      handleApplyMaterialToSegment(selectedSegmentId, material);
    }
  };

  // Apply full AI generated palette to zones
  const handleApplyPalette = (materials: Material[]) => {
    if (materials.length === 0) return;
    const nextSegments = segments.map((seg, idx) => ({
      ...seg,
      appliedMaterial: materials[idx % materials.length]
    }));
    setSegments(nextSegments);
    pushHistory(nextSegments);
    showToast('Applied AI Curated Material Palette');
  };

  // Open PBR Specs Inspector Modal
  const handleOpenSpecsModal = (material: Material) => {
    setInspectedMaterial(material);
    setIsPbrModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] flex flex-col font-sans selection:bg-[#38bdf8]/30 selection:text-white">
      {/* 1. Global Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAdvisor={() => setIsAdvisorModalOpen(true)}
      />

      {/* 2. Main Views Switcher */}
      <div className="flex-1 flex flex-col pt-16">
        {currentView === 'landing' && (
          <LandingPage
            onSelectSpace={handleSelectSpace}
            onConfirmTargetAndProceed={handleConfirmTargetAndProceed}
            onNavigateToStudio={() => setCurrentView('visualizer')}
            onNavigateToCatalog={() => setCurrentView('catalog')}
            onOpenSpecsModal={handleOpenSpecsModal}
          />
        )}

        {currentView === 'visualizer' && (
          <div className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Left Studio Tool Strip & Surface Layers */}
            <LeftStudioToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              activeSection={activeSubSection}
              onSelectSection={setActiveSubSection}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onExport={() => setIsExportModalOpen(true)}
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
            />

            {/* Central Studio Canvas Viewport */}
            <StudioCanvas
              space={currentSpace}
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
              selectedMaterial={selectedMaterial}
              renderParameters={renderParameters}
              activeTool={activeTool}
              onApplyMaterialToSegment={handleApplyMaterialToSegment}
              onQuickApplyMaterial={handleQuickApplyMaterial}
              onNavigateToCatalog={() => setCurrentView('catalog')}
              onOpenSpecsModal={handleOpenSpecsModal}
            />

            {/* Right Inspector & Materials Library Panel */}
            <RightInspectorPanel
              selectedMaterial={selectedMaterial}
              onSelectMaterial={handleQuickApplyMaterial}
              renderParameters={renderParameters}
              onChangeParameters={setRenderParameters}
              onOpenSpecsModal={handleOpenSpecsModal}
            />
          </div>
        )}

        {currentView === 'catalog' && (
          <MaterialCatalog
            activeSpace={currentSpace}
            targetComponent={activeTargetComponent}
            onChangeTargetOrSpace={() => setCurrentView('landing')}
            onSelectMaterialForStudio={(mat) => {
              handleQuickApplyMaterial(mat);
              setCurrentView('visualizer');
            }}
            onOpenSpecsModal={handleOpenSpecsModal}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            onLoadSpace={handleSelectSpace}
            onNavigateToStudio={() => setCurrentView('visualizer')}
          />
        )}
      </div>

      {/* 3. Floating Modals */}
      {/* PBR Specs Modal */}
      <PbrModal
        material={inspectedMaterial}
        isOpen={isPbrModalOpen}
        onClose={() => setIsPbrModalOpen(false)}
        onApplyInStudio={(mat) => {
          handleQuickApplyMaterial(mat);
          setCurrentView('visualizer');
        }}
      />

      {/* 4K Export Project Bundle Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        space={currentSpace}
        segments={segments}
      />

      {/* AI Surface Harmony Stylist Modal */}
      <AiAdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        onApplyPalette={handleApplyPalette}
      />

      {/* 4. Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[#182028]/95 backdrop-blur-md border border-[#38bdf8]/50 text-[#dae3ee] text-xs font-medium px-4 py-2 rounded-xl shadow-2xl shadow-black/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

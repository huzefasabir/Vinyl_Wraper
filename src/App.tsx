import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { VisionSegmentationResult, pollVolkaStatus } from './services/api';
import { log } from './services/logger';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'landing' | 'visualizer' | 'catalog' | 'projects'>('landing');

  // Active space, segments & target component
  const [currentSpace, setCurrentSpace] = useState<SpaceImage>(PRESET_SPACES[0]);
  const [segments, setSegments] = useState<SpaceSegment[]>(PRESET_SPACES[0].segments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    PRESET_SPACES[0].segments[0]?.id || null
  );
  const [activeTargetComponent, setActiveTargetComponent] = useState<string>('');

  // Selected Material & Shader Parameters
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(MATERIALS[0]);
  const [renderParameters, setRenderParameters] = useState<RenderParameters>({
    grainDirection: 0,
    roughness: 80,
    reflectivity: 20,
    textureScale: 1.0,
    ambientLight: 85
  });

  // Active Studio Tools & Sub-nav
  const [activeTool, setActiveTool] = useState<StudioTool>('select');
  const [activeSubSection, setActiveSubSection] = useState<SubNavSection>('layers');

  // History stack for Undo / Redo
  const [history, setHistory] = useState<SpaceSegment[][]>([[...PRESET_SPACES[0].segments]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals state
  const [inspectedMaterial, setInspectedMaterial] = useState<Material>(MATERIALS[0]);
  const [isPbrModalOpen, setIsPbrModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Polling ref for active Volka HF job
  const volkaPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopVolkaPolling = () => {
    if (volkaPollingRef.current !== null) {
      clearInterval(volkaPollingRef.current);
      volkaPollingRef.current = null;
    }
  };

  // Start polling when currentSpace has a pending volka job
  useEffect(() => {
    const jobId = currentSpace.volkaJobId;
    const status = currentSpace.volkaStatus;

    if (!jobId || status !== 'pending') {
      stopVolkaPolling();
      return;
    }

    log.hf('App:polling', `Starting poll loop — job_id: ${jobId}`);

    volkaPollingRef.current = setInterval(async () => {
      try {
        log.poll('App:polling', `GET /api/volka-status/${jobId}`);
        const res = await pollVolkaStatus(jobId);
        log.poll('App:polling', `status=${res.status}`, res);

        if (res.status === 'done' && res.hfSegmentedImage) {
          stopVolkaPolling();
          log.ok('App:polling', `Job ${jobId} DONE — updating canvas image`);
          setCurrentSpace(prev => ({
            ...prev,
            hfSegmentedImage: res.hfSegmentedImage,
            previewImage: res.hfSegmentedImage,
            volkaStatus: 'done',
          }));
          showToast('HF Space segmentation complete — preview updated');
        } else if (res.status === 'error') {
          stopVolkaPolling();
          log.error('App:polling', `Job ${jobId} ERROR: ${res.error}`);
          setCurrentSpace(prev => ({ ...prev, volkaStatus: 'error' }));
          showToast('HF Space processing encountered an error');
        }
      } catch (err) {
        log.warn('App:polling', 'Poll request failed', err);
      }
    }, 3000);

    return () => stopVolkaPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace.volkaJobId, currentSpace.volkaStatus]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Push new state to history
  const pushHistory = useCallback((newSegments: SpaceSegment[]) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newSegments];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

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

  // Post-upload target confirm flow: stores job_id, sets space, navigates immediately to catalog
  const handleConfirmTargetAndProceed = async (
    space: SpaceImage,
    targetName: string,
    jobId?: string,
    visionResult?: VisionSegmentationResult
  ) => {
    log.info('App:flow', `Target confirmed: "${targetName}" | job_id: ${jobId ?? 'none'}`);

    const spaceWithJob: SpaceImage = {
      ...space,
      volkaJobId: jobId,
      volkaStatus: jobId ? 'pending' : 'idle',
    };

    setCurrentSpace(spaceWithJob);
    setActiveTargetComponent(targetName);

    const slug = targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const userSegment: SpaceSegment = {
      id: `seg-${slug}-target`,
      name: targetName,
      confidence: 1.0,
      boundingBox: { x: 0.05, y: 0.05, width: 0.9, height: 0.9 },
      pathCoordinates: [
        { x: 0.05, y: 0.05 },
        { x: 0.95, y: 0.05 },
        { x: 0.95, y: 0.95 },
        { x: 0.05, y: 0.95 },
      ],
      areaPercentage: 81,
    };

    const initialSegments: SpaceSegment[] = [userSegment];
    setSegments(initialSegments);
    setSelectedSegmentId(userSegment.id);
    setHistory([initialSegments]);
    setHistoryIndex(0);

    if (jobId) {
      log.hf('App:flow', `HF job ${jobId} running in background — navigating to catalog`);
      showToast(`"${targetName}" sent to HF Space — processing while you pick a vinyl style`);
    }

    setCurrentView('catalog');
  };

  const handleDetectCustomComponent = async (_query: string) => {
    // AI Vision Locate removed — no-op
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
            onConfirmTargetAndProceed={(space, targetName, jobId, visionResult) =>
              handleConfirmTargetAndProceed(space, targetName, jobId, visionResult)
            }
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
              volkaStatus={currentSpace.volkaStatus}
              onCvRenderComplete={(compositeDataUrl) => {
                // CV pipeline succeeded — replace the HF preview with the
                // photorealistic composited result so the canvas shows it
                setCurrentSpace((prev) => ({
                  ...prev,
                  hfSegmentedImage: compositeDataUrl,
                  previewImage:     compositeDataUrl,
                }));
                showToast('CV render complete — photorealistic vinyl wrap applied');
              }}
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
            volkaStatus={currentSpace.volkaStatus}
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

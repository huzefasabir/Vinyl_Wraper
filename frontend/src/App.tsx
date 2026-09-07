import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { LeftStudioToolbar } from './components/LeftStudioToolbar';
import { StudioCanvas } from './components/StudioCanvas';
import { RightInspectorPanel } from './components/RightInspectorPanel';
import { MaterialCatalog } from './components/MaterialCatalog';
import { NotFoundPage } from './components/NotFoundPage';
import { PbrModal } from './components/PbrModal';
import { ExportModal } from './components/ExportModal';
import { TargetSurfaceModal } from './components/TargetSurfaceModal';
import { PRESET_SPACES } from './data/presetSpaces';
import { MATERIALS } from './data/materialsData';
import { SpaceImage, SpaceSegment, Material, RenderParameters, StudioTool, SubNavSection } from './types';
import { VisionSegmentationResult, pollVolkaStatus, startVolkaAnalysis } from './services/api';
import { log } from './services/logger';

// Application Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught studio error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <NotFoundPage
          onNavigate={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
          errorMessage={this.state.error?.message || 'An unexpected application error occurred.'}
        />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  // Navigation
  const [currentView, setCurrentView] = useState<'landing' | 'visualizer' | 'catalog' | '404'>('landing');
  const [notFoundError, setNotFoundError] = useState<string>('');

  // Active space, segments & target component
  const [currentSpace, setCurrentSpace] = useState<SpaceImage>(PRESET_SPACES[0]);
  const [segments, setSegments] = useState<SpaceSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
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
  const [history, setHistory] = useState<SpaceSegment[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals state
  const [inspectedMaterial, setInspectedMaterial] = useState<Material>(MATERIALS[0]);
  const [isPbrModalOpen, setIsPbrModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Panel visibility (collapsible panels)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Polling ref for active Volka HF job & retry count
  const volkaPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volkaRetryCountRef = useRef<number>(0);

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
      volkaRetryCountRef.current = 0;
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
          volkaRetryCountRef.current = 0;
          log.ok('App:polling', `Job ${jobId} DONE — updating canvas image`);
          setSegments((prev) =>
            prev.map((seg) =>
              seg.id === selectedSegmentId || seg.name.toLowerCase() === activeTargetComponent.toLowerCase()
                ? { ...seg, maskBase64: res.hfSegmentedImage }
                : seg
            )
          );
          setCurrentSpace((prev) => ({
            ...prev,
            hfSegmentedImage: res.hfSegmentedImage,
            previewImage: res.hfSegmentedImage,
            volkaStatus: 'done',
          }));
          showToast('HF Space segmentation complete — generating vinyl preview');
        } else if (res.status === 'error') {
          volkaRetryCountRef.current += 1;
          const attempt = volkaRetryCountRef.current;
          log.error('App:polling', `Job ${jobId} ERROR (Attempt ${attempt}/3): ${res.error}`);

          if (attempt < 3) {
            showToast(`HF Space processing failed — retrying analysis (${attempt}/3)...`);
            // Attempt restart
            try {
              const retryRes = await startVolkaAnalysis(
                currentSpace.imageUrl,
                activeTargetComponent || 'surface',
                'retry.jpg'
              );
              setCurrentSpace((prev) => ({
                ...prev,
                volkaJobId: retryRes.job_id,
                volkaStatus: 'pending',
              }));
            } catch (rErr) {
              log.warn('App:polling', 'Retry submission failed', rErr);
            }
          } else {
            // All 3 attempts failed
            stopVolkaPolling();
            setCurrentSpace((prev) => ({ ...prev, volkaStatus: 'error' }));
            showToast('HF Space segmentation failed after 3 attempts. Please re-upload your image.');
            setTimeout(() => {
              setCurrentView('landing');
            }, 2500);
          }
        }
      } catch (err) {
        log.warn('App:polling', 'Poll request failed', err);
      }
    }, 3000);

    return () => stopVolkaPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace.volkaJobId, currentSpace.volkaStatus, activeTargetComponent]);

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

  // Load new space — reset segments so only user-added target components are shown
  const handleSelectSpace = (space: SpaceImage) => {
    setCurrentSpace(space);
    setSegments([]);
    setSelectedSegmentId(null);
    setHistory([[]]);
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

    const originalImage = space.beforeImageUrl || space.imageUrl;
    const isSameSpace = currentSpace.id === space.id;

    const spaceWithJob: SpaceImage = {
      ...space,
      imageUrl: originalImage,
      beforeImageUrl: originalImage,
      hfSegmentedImage: undefined,
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

    setSegments((prev) => {
      // If switching to a new room image, start fresh with only this target component
      if (!isSameSpace || prev.length === 0) {
        return [userSegment];
      }
      // If wrapping another component on the same room image ("Wrap Something Else"), append or update
      const exists = prev.some(
        (s) => s.id === userSegment.id || s.name.toLowerCase() === userSegment.name.toLowerCase()
      );
      if (exists) {
        return prev.map((s) =>
          s.id === userSegment.id || s.name.toLowerCase() === userSegment.name.toLowerCase()
            ? { ...s, ...userSegment }
            : s
        );
      }
      return [...prev, userSegment];
    });
    setSelectedSegmentId(userSegment.id);

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
  const handleApplyMaterialToSegment = (segmentId: string, material: Material | null) => {
    const nextSegments = segments.map((seg) => {
      if (seg.id === segmentId) {
        if (!material) {
          const { appliedMaterial, ...rest } = seg;
          return rest as SpaceSegment;
        }
        return {
          ...seg,
          appliedMaterial: material,
          renderParameters: {
            ...seg.renderParameters,
            roughness: Math.round((material.pbr?.roughness ?? 0.8) * 100),
            reflectivity: Math.round((material.pbr?.specular ?? 0.2) * 100)
          }
        };
      }
      return seg;
    });

    setSegments(nextSegments);
    pushHistory(nextSegments);
    if (material) {
      showToast(`Applied ${material.sku || material.code} (${material.name}) to ${activeTargetComponent || 'surface'}`);
    }
  };

  // Quick apply material to currently selected zone
  const handleQuickApplyMaterial = (material: Material) => {
    if (!material) return;
    setSelectedMaterial(material);
    setRenderParameters((prev) => ({
      ...prev,
      roughness: Math.round((material.pbr?.roughness ?? 0.8) * 100),
      reflectivity: Math.round((material.pbr?.specular ?? 0.2) * 100)
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

  // Switch active surface segment & load its saved wrap / mask / material
  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    const targetSeg = segments.find((s) => s.id === segmentId);
    if (targetSeg) {
      setActiveTargetComponent(targetSeg.name);
      if (targetSeg.appliedMaterial) {
        setSelectedMaterial(targetSeg.appliedMaterial);
      }
      if (targetSeg.cutoutBase64) {
        setCurrentSpace((prev) => ({
          ...prev,
          hfSegmentedImage: targetSeg.cutoutBase64,
          previewImage: targetSeg.cutoutBase64,
        }));
      } else if (targetSeg.maskBase64) {
        setCurrentSpace((prev) => ({
          ...prev,
          hfSegmentedImage: targetSeg.maskBase64,
          previewImage: targetSeg.maskBase64,
        }));
      }
      showToast(`Selected surface: ${targetSeg.name}`);
    }
  };

  return (
    <div className={`w-full bg-[#0b141c] text-[#dae3ee] flex flex-col font-sans selection:bg-[#38bdf8]/30 selection:text-white ${currentView === 'visualizer' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}>
      {/* 1. Global Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* 2. Main Views Switcher */}
      <div className={`flex-1 flex flex-col pt-16 ${currentView === 'visualizer' ? 'h-[calc(100vh-64px)] min-h-0 overflow-hidden' : ''
        }`}>
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
          <div className="w-full h-full flex overflow-hidden relative">
            {/* Floating button to restore Left Panel when closed */}
            {!isLeftPanelOpen && (
              <button
                onClick={() => setIsLeftPanelOpen(true)}
                className="absolute top-16 left-4 z-40 bg-[#0b141c]/90 hover:bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/50 p-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold hover:border-[#38bdf8] transition-all group"
                title="Open Studio Tools Panel"
              >
                <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Studio Tools</span>
              </button>
            )}

            {/* Left Studio Tool Strip & Surface Layers */}
            {isLeftPanelOpen && (
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
                onSelectSegment={handleSelectSegment}
                onWrapSomethingElse={() => setIsTargetModalOpen(true)}
                onClosePanel={() => setIsLeftPanelOpen(false)}
              />
            )}

            {/* Central Studio Canvas Viewport */}
            <StudioCanvas
              space={currentSpace}
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={handleSelectSegment}
              selectedMaterial={selectedMaterial}
              renderParameters={renderParameters}
              activeTool={activeTool}
              onApplyMaterialToSegment={handleApplyMaterialToSegment}
              onQuickApplyMaterial={handleQuickApplyMaterial}
              onNavigateToCatalog={() => setCurrentView('catalog')}
              onOpenSpecsModal={handleOpenSpecsModal}
              volkaStatus={currentSpace.volkaStatus}
              onCvRenderComplete={(compositeDataUrl) => {
                // CV pipeline succeeded — save composite image and material to segment
                setSegments((prev) =>
                  prev.map((seg) =>
                    seg.id === selectedSegmentId || seg.name.toLowerCase() === activeTargetComponent.toLowerCase()
                      ? { ...seg, cutoutBase64: compositeDataUrl, appliedMaterial: selectedMaterial }
                      : seg
                  )
                );
                setCurrentSpace((prev) => ({
                  ...prev,
                  hfSegmentedImage: compositeDataUrl,
                  previewImage: compositeDataUrl,
                }));
                showToast(`CV render complete — wrapped ${activeTargetComponent || 'surface'}`);
              }}
            />

            {/* Floating button to restore Right Panel when closed */}
            {!isRightPanelOpen && (
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="absolute top-16 right-4 z-40 bg-[#0b141c]/90 hover:bg-[#182028] text-[#38bdf8] border border-[#38bdf8]/50 p-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold hover:border-[#38bdf8] transition-all group"
                title="Open Vinyl Library Panel"
              >
                <PanelRightOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Vinyl Styles</span>
              </button>
            )}

            {/* Right Inspector & Materials Library Panel */}
            {isRightPanelOpen && (
              <RightInspectorPanel
                selectedMaterial={selectedMaterial}
                onSelectMaterial={handleQuickApplyMaterial}
                renderParameters={renderParameters}
                onChangeParameters={setRenderParameters}
                onOpenSpecsModal={handleOpenSpecsModal}
                onClosePanel={() => setIsRightPanelOpen(false)}
              />
            )}
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

        {currentView === '404' && (
          <NotFoundPage
            onNavigate={(view) => {
              setNotFoundError('');
              setCurrentView(view);
            }}
            errorMessage={notFoundError || 'The requested architectural page or material resource was not found.'}
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
        displayImage={currentSpace.previewImage || currentSpace.hfSegmentedImage || currentSpace.imageUrl}
      />

      {/* Target Surface Modal for Wrap Something Else */}
      <TargetSurfaceModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        space={currentSpace}
        onConfirmTarget={(targetName, jobId, visionResult) => {
          setIsTargetModalOpen(false);
          handleConfirmTargetAndProceed(currentSpace, targetName, jobId, visionResult);
        }}
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

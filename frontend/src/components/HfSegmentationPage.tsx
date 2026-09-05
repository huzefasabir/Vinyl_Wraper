/**
 * HF Segmentation Lab
 * ───────────────────
 * A dedicated page for running and inspecting the
 * Volkopat/SegmentAnythingxGroundingDINO model on Hugging Face Space.
 *
 * Inputs  : uploaded image  +  target surface text
 * Process : fires POST /api/volka-analyze (fire-and-forget job)
 *           polls  GET /api/volka-status/:id  every 2 s
 * Output  : annotated segmented image  +  live event log stream
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Scan, Loader2, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, Download, Terminal, Image,
  Sparkles, Clock, Zap
} from 'lucide-react';
import { startVolkaAnalysis, pollVolkaStatus } from '../services/api';
import { log } from '../services/logger';

// ── types ─────────────────────────────────────────────────────────────────────
type JobPhase =
  | 'idle'
  | 'uploading'
  | 'queued'
  | 'connecting_hf'
  | 'running'
  | 'done'
  | 'error';

interface LogEntry {
  id: number;
  ts: string;
  level: 'info' | 'ok' | 'warn' | 'error' | 'hf' | 'poll';
  msg: string;
}

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  info: 'text-[#38bdf8]',
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  hf: 'text-purple-400',
  poll: 'text-[#64748b]',
};
const LEVEL_TAG: Record<LogEntry['level'], string> = {
  info: 'INFO ',
  ok: 'OK   ',
  warn: 'WARN ',
  error: 'ERROR',
  hf: 'HF   ',
  poll: 'POLL ',
};

const ts = () => new Date().toISOString().slice(11, 23);

const CHIPS = [
  'Kitchen Cabinets', 'Countertops', 'Backsplash',
  'Wardrobes', 'Accent Wall', 'Door', 'Floor', 'Ceiling',
];

const PHASE_STEPS: { phase: JobPhase; label: string }[] = [
  { phase: 'uploading', label: 'Encode image' },
  { phase: 'queued', label: 'Queue HF job' },
  { phase: 'connecting_hf', label: 'Connect to HF Space' },
  { phase: 'running', label: 'Run segmentation' },
  { phase: 'done', label: 'Receive result' },
];

// ── component ─────────────────────────────────────────────────────────────────
interface HfSegmentationPageProps {
  onNavigateHome?: () => void;
}

export const HfSegmentationPage: React.FC<HfSegmentationPageProps> = ({ onNavigateHome }) => {
  // inputs
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // job state
  const [phase, setPhase] = useState<JobPhase>('idle');
  const [jobId, setJobId] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // live log
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const entryId = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const addLog = useCallback((level: LogEntry['level'], msg: string) => {
    setEntries(prev => {
      const next = [...prev, { id: entryId.current++, ts: ts(), level, msg }];
      // keep last 200 lines
      return next.length > 200 ? next.slice(-200) : next;
    });
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
    }, 30);
  }, []);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const resetAll = () => {
    stopPolling();
    setPhase('idle');
    setJobId('');
    setResultImage('');
    setDescription('');
    setElapsedMs(0);
    setEntries([]);
  };

  // ── file handling ──────────────────────────────────────────────────────────
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addLog('error', `Not an image file: ${file.name}`);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageDataUrl(url);
      addLog('info', `Image loaded: ${file.name}  (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!imageDataUrl || !prompt.trim() || phase !== 'idle') return;

    resetAll();
    startTimeRef.current = Date.now();

    // kick off elapsed-time ticker
    const ticker = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    addLog('info', `=== NEW SEGMENTATION JOB ===`);
    addLog('info', `Image: ${imageFile?.name ?? 'uploaded'}  |  Prompt: "${prompt.trim()}"`);
    addLog('hf', `Space: Volkopat/SegmentAnythingxGroundingDINO`);

    // ── step 1: encode ────────────────────────────────────────────────────
    setPhase('uploading');
    addLog('info', `Encoding image to base64 for transport...`);
    log.info('HfSegPage', `Encoding image for prompt="${prompt.trim()}"`);

    // ── step 2: queue job ─────────────────────────────────────────────────
    setPhase('queued');
    addLog('hf', `POST /api/volka-analyze  prompt="${prompt.trim()}"`);
    log.hf('HfSegPage', `POST /volka-analyze  prompt="${prompt.trim()}"`);

    let newJobId = '';
    try {
      const res = await startVolkaAnalysis(
        imageDataUrl,
        prompt.trim(),
        imageFile?.name ?? 'room.jpg'
      );
      newJobId = res.job_id;
      setJobId(newJobId);
      addLog('ok', `Job queued — job_id: ${newJobId}`);
      log.ok('HfSegPage', `Job queued — job_id: ${newJobId}`);
    } catch (err: any) {
      addLog('error', `Failed to queue job: ${err.message}`);
      log.error('HfSegPage', `Failed to queue job: ${err.message}`);
      setPhase('error');
      clearInterval(ticker);
      return;
    }

    // ── step 3: connect + poll ─────────────────────────────────────────────
    setPhase('connecting_hf');
    addLog('hf', `Connecting to HF Space... (first poll in 2 s)`);

    let pollCount = 0;
    pollRef.current = setInterval(async () => {
      pollCount++;
      const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);

      try {
        const status = await pollVolkaStatus(newJobId);
        addLog('poll', `Poll #${pollCount}  [${elapsed}s]  status=${status.status}`);
        log.poll('HfSegPage', `#${pollCount}  status=${status.status}  job=${newJobId.slice(0, 8)}…`);

        if (pollCount === 1) {
          setPhase('running');
          addLog('hf', `HF Space picked up job — segmentation running...`);
        }

        if (status.status === 'done') {
          stopPolling();
          clearInterval(ticker);
          setElapsedMs(Date.now() - startTimeRef.current);

          if (status.hfSegmentedImage) {
            setResultImage(status.hfSegmentedImage);
            addLog('ok', `Segmented image received  (${Math.round(status.hfSegmentedImage.length / 1024)} KB)`);
          }
          if (status.description) {
            setDescription(status.description);
            addLog('ok', `Description: "${status.description}"`);
          }
          addLog('ok', `=== JOB COMPLETE in ${((Date.now() - startTimeRef.current) / 1000).toFixed(1)}s ===`);
          log.ok('HfSegPage', `Job ${newJobId.slice(0, 8)}… DONE in ${((Date.now() - startTimeRef.current) / 1000).toFixed(1)}s`);
          setPhase('done');

        } else if (status.status === 'error') {
          stopPolling();
          clearInterval(ticker);
          addLog('error', `HF Space returned error: ${status.error ?? 'unknown'}`);
          log.error('HfSegPage', `Job ${newJobId.slice(0, 8)}… ERROR: ${status.error}`);
          setPhase('error');
        }

      } catch (err: any) {
        addLog('warn', `Poll #${pollCount} request failed: ${err.message}`);
        log.warn('HfSegPage', `Poll #${pollCount} failed: ${err.message}`);
      }
    }, 2000);
  };

  // ── download helper ────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `segmented_${prompt.replace(/\s+/g, '_')}_${Date.now()}.png`;
    a.click();
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const isRunning = ['uploading', 'queued', 'connecting_hf', 'running'].includes(phase);
  const phaseIndex = PHASE_STEPS.findIndex(s => s.phase === phase);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060f16] text-[#dae3ee] flex flex-col">

      {/* ── page header ──────────────────────────────────────────────────── */}
      <div className="bg-[#0b141c] border-b border-[#3e484f]/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="text-[#87929a] hover:text-[#dae3ee] transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-[#dae3ee]">HF Segmentation Lab</h1>
            <p className="text-[11px] font-mono text-[#87929a]">
              Volkopat/SegmentAnythingxGroundingDINO · Grounded SAM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#87929a]">HF Space Active</span>
        </div>
      </div>

      {/* ── main grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">

        {/* ═══ LEFT COLUMN — inputs + progress ═══════════════════════════ */}
        <div className="flex flex-col gap-5 p-6 border-r border-[#3e484f]/30 overflow-y-auto">

          {/* image drop zone */}
          <section>
            <label className="block text-xs font-semibold text-[#dae3ee] mb-2 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-[#38bdf8]" />
              Input Image
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => !imageDataUrl && fileInputRef.current?.click()}
              className={`relative w-full rounded-2xl border-2 transition-all overflow-hidden cursor-pointer
                ${isDragging
                  ? 'border-[#38bdf8] bg-[#38bdf8]/5'
                  : imageDataUrl
                    ? 'border-[#3e484f]/60 bg-[#0b141c]'
                    : 'border-dashed border-[#3e484f]/60 bg-[#0b141c] hover:border-[#38bdf8]/50'
                }`}
            >
              {imageDataUrl ? (
                <>
                  <img
                    src={imageDataUrl}
                    alt="input"
                    className="w-full aspect-video object-cover"
                  />
                  {/* swap button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="absolute top-2 right-2 bg-[#0b141c]/80 backdrop-blur-sm border border-[#3e484f]/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#87929a] hover:text-[#dae3ee] flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Replace
                  </button>
                  <div className="absolute bottom-2 left-2 bg-[#0b141c]/80 backdrop-blur-sm border border-[#3e484f]/40 rounded px-2 py-0.5 text-[10px] font-mono text-[#87929a]">
                    {imageFile?.name}
                  </div>
                </>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#182028] border border-[#3e484f]/60 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#87929a]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#dae3ee]">Drop image here or click to upload</p>
                    <p className="text-[11px] text-[#87929a] mt-0.5">JPG, PNG, WEBP · any size</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </section>

          {/* target surface input */}
          <section>
            <label className="block text-xs font-semibold text-[#dae3ee] mb-2 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-[#38bdf8]" />
              Target Surface Prompt
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isRunning}
              placeholder="e.g., Kitchen Cabinets, Countertops, Backsplash..."
              className="w-full bg-[#182028] border border-[#3e484f] focus:border-[#38bdf8] rounded-xl px-4 py-2.5 text-sm text-[#dae3ee] placeholder:text-[#87929a]/60 focus:outline-none transition-colors disabled:opacity-50"
            />
            {/* quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setPrompt(chip)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border
                    ${prompt === chip
                      ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8]'
                      : 'bg-[#182028] border-[#3e484f]/50 text-[#87929a] hover:text-[#dae3ee] hover:border-[#38bdf8]/40'
                    } disabled:opacity-40`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          {/* progress pipeline */}
          {phase !== 'idle' && (
            <section className="bg-[#0b141c] rounded-2xl border border-[#3e484f]/40 p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono font-bold text-[#87929a] uppercase tracking-widest">
                  Pipeline Progress
                </span>
                {isRunning && (
                  <span className="text-[11px] font-mono text-[#38bdf8] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
                {phase === 'done' && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {PHASE_STEPS.map((step, i) => {
                const isActive = step.phase === phase;
                const isDone = phase === 'done' || (phaseIndex > i);
                const isPending = !isActive && !isDone;

                return (
                  <div key={step.phase} className="flex items-center gap-3">
                    {/* icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                      ${isDone ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : isActive ? 'bg-[#38bdf8]/15 border border-[#38bdf8]/60'
                          : 'bg-[#182028] border border-[#3e484f]/40'}`}
                    >
                      {isDone
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        : isActive
                          ? <Loader2 className="w-3.5 h-3.5 text-[#38bdf8] animate-spin" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-[#3e484f]" />
                      }
                    </div>
                    {/* label */}
                    <span className={`text-xs transition-colors
                      ${isDone ? 'text-emerald-400'
                        : isActive ? 'text-[#38bdf8] font-semibold'
                          : 'text-[#3e484f]'}`}
                    >
                      {step.label}
                    </span>
                    {/* connector */}
                    {i < PHASE_STEPS.length - 1 && (
                      <div className={`ml-auto w-px h-4 ${isDone ? 'bg-emerald-500/30' : 'bg-[#3e484f]/30'}`} />
                    )}
                  </div>
                );
              })}

              {phase === 'error' && (
                <div className="flex items-center gap-2 mt-1 text-red-400 text-xs">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Job failed — check the log below</span>
                </div>
              )}
            </section>
          )}

          {/* job meta */}
          {jobId && (
            <div className="bg-[#0b141c] rounded-xl border border-[#3e484f]/40 p-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#87929a]">job_id</span>
                <span className="text-[#38bdf8] truncate ml-3">{jobId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#87929a]">prompt</span>
                <span className="text-[#dae3ee]">{prompt}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#87929a]">status</span>
                <span className={
                  phase === 'done' ? 'text-emerald-400' :
                    phase === 'error' ? 'text-red-400' :
                      isRunning ? 'text-[#38bdf8]' : 'text-[#87929a]'
                }>{phase}</span>
              </div>
            </div>
          )}

          {/* run / reset buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleRun}
              disabled={!imageDataUrl || !prompt.trim() || isRunning}
              className="flex-1 py-3 rounded-xl bg-[#38bdf8] hover:bg-[#8ed5ff] disabled:opacity-40 text-[#00354a] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#38bdf8]/20"
            >
              {isRunning
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing...</span></>
                : <><Zap className="w-4 h-4" /><span>Run Segmentation</span></>
              }
            </button>

            {phase !== 'idle' && (
              <button
                onClick={resetAll}
                disabled={isRunning}
                className="px-4 py-3 rounded-xl bg-[#182028] hover:bg-[#222b33] border border-[#3e484f]/60 text-[#87929a] hover:text-[#dae3ee] text-sm transition-colors disabled:opacity-40"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN — result + live log ══════════════════════════ */}
        <div className="flex flex-col min-h-0 overflow-hidden">

          {/* result image panel */}
          <div className="flex-[2] min-h-0 bg-[#060f16] border-b border-[#3e484f]/30 relative flex items-center justify-center overflow-hidden">

            {/* idle / waiting state */}
            {phase === 'idle' && !resultImage && (
              <div className="flex flex-col items-center gap-3 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-[#0b141c] border border-[#3e484f]/40 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#3e484f]" />
                </div>
                <p className="text-sm text-[#87929a]">Segmented result will appear here</p>
                <p className="text-[11px] font-mono text-[#3e484f]">
                  Upload an image and enter a target surface to begin
                </p>
              </div>
            )}

            {/* loading spinner */}
            {isRunning && !resultImage && (
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
                  <div className="w-14 h-14 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                  <Sparkles className="absolute w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#dae3ee]">
                    Segmenting "{prompt}"
                  </p>
                  <p className="text-[11px] font-mono text-purple-400 mt-0.5">
                    SegmentAnything × GroundingDINO
                  </p>
                  <p className="text-[11px] text-[#87929a] mt-1">
                    {(elapsedMs / 1000).toFixed(1)}s elapsed
                  </p>
                </div>
                {/* shimmer bar */}
                <div className="w-48 h-1 bg-[#182028] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-purple-500/30 via-purple-400 to-purple-500/30 animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                </div>
              </div>
            )}

            {/* error state */}
            {phase === 'error' && !resultImage && (
              <div className="flex flex-col items-center gap-3 text-center px-8">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-sm font-semibold text-red-400">Segmentation failed</p>
                <p className="text-[11px] text-[#87929a]">Check the event log for details</p>
              </div>
            )}

            {/* result image */}
            {resultImage && (
              <>
                <img
                  src={resultImage}
                  alt="HF segmentation result"
                  className="w-full h-full object-contain"
                />
                {/* overlay badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0b141c]/85 backdrop-blur-sm border border-emerald-500/40 rounded-lg px-2.5 py-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Segmented · {prompt}
                </div>
                <button
                  onClick={handleDownload}
                  className="absolute top-3 right-3 bg-[#0b141c]/85 backdrop-blur-sm border border-[#3e484f]/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#87929a] hover:text-[#dae3ee] flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save
                </button>
                {description && (
                  <div className="absolute bottom-3 left-3 right-3 bg-[#0b141c]/85 backdrop-blur-sm border border-[#3e484f]/40 rounded-lg px-3 py-2 text-[11px] text-[#bdc8d1]">
                    {description}
                  </div>
                )}
              </>
            )}
          </div>

          {/* live event log */}
          <div className="flex-1 min-h-0 flex flex-col bg-[#040d13]">
            {/* log header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#3e484f]/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-[11px] font-mono font-bold text-[#87929a] uppercase tracking-widest">
                  Event Log
                </span>
                <span className="text-[10px] font-mono bg-[#182028] text-[#87929a] px-1.5 py-0.5 rounded">
                  {entries.length} events
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#3e484f]">
                Filter in DevTools Console: VW:HfSegPage
              </span>
            </div>

            {/* log body */}
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5 scrollbar-none"
            >
              {entries.length === 0 ? (
                <p className="text-[#3e484f] mt-4">Waiting for events...</p>
              ) : (
                entries.map(e => (
                  <div key={e.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#3e484f] flex-shrink-0 select-none">{e.ts}</span>
                    <span className={`flex-shrink-0 select-none ${LEVEL_STYLE[e.level]}`}>
                      {LEVEL_TAG[e.level]}
                    </span>
                    <span className={`break-all ${LEVEL_STYLE[e.level]}`}>{e.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

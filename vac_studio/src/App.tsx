import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Code2,
  Music,
  Clock,
  Sparkles,
  RefreshCw,
  Activity,
  Download
} from './components/icons';
import { DaemonDiscovery, DiscoveryResult } from './client/bootstrap';
import { VacRpcClient, ConnectionState } from './client/ws_client';

import { HyperFramesHost } from './components/stage/HyperFramesHost';

const RemotionHost = lazy(() =>
  import('./components/stage/RemotionHost').then((m) => ({ default: m.RemotionHost }))
);

export function App() {
  // Connection State
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [connState, setConnState] = useState<ConnectionState>('DISCONNECTED');
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);
  const rpcClientRef = useRef<VacRpcClient | null>(null);

  // Studio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(128);
  const totalFrames = 900;
  const fps = 60;
  const queryEngine = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('engine') as 'remotion' | 'hyperframes' | 'motion2code' | null)
    : null;
  const [activeEngine, setActiveEngine] = useState<'remotion' | 'hyperframes' | 'motion2code'>(
    queryEngine === 'hyperframes' || queryEngine === 'motion2code' ? queryEngine : 'remotion'
  );
  const [engineReady, setEngineReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'armory' | 'templates' | 'sounds'>('armory');
  const [showSafeGuides, setShowSafeGuides] = useState(true);
  const [timelineZoom, setTimelineZoom] = useState(100);

  // Mount engine runner on next tick past first paint
  useEffect(() => {
    (window as any).__VAC_STUDIO_READY__ = true;
    const animId = requestAnimationFrame(() => setEngineReady(true));
    (window as any).__VAC_SET_ACTIVE_ENGINE__ = (engine: 'remotion' | 'hyperframes' | 'motion2code') => {
      setActiveEngine(engine);
    };
    (window as any).__VAC_PLAY__ = () => {
      setCurrentFrame(0);
      setIsPlaying(true);
    };
    (window as any).__VAC_PAUSE__ = () => {
      setIsPlaying(false);
    };
    (window as any).__VAC_SEEK__ = (frame: number) => {
      setCurrentFrame(frame);
    };
    return () => {
      cancelAnimationFrame(animId);
      delete (window as any).__VAC_SET_ACTIVE_ENGINE__;
      delete (window as any).__VAC_PLAY__;
      delete (window as any).__VAC_PAUSE__;
      delete (window as any).__VAC_SEEK__;
    };
  }, []);

  // Discovery Routine
  const runDiscovery = async () => {
    setProbing(true);
    setProbeError(null);
    try {
      const res = await DaemonDiscovery.discover(9720, 9740, 150);
      setDiscovery(res);
      // Connect WebSocket
      if (rpcClientRef.current) {
        rpcClientRef.current.disconnect();
      }
      const client = new VacRpcClient(res.wsEndpoint);
      rpcClientRef.current = client;
      client.onStateChange((state) => setConnState(state));
      await client.connect();
    } catch (err: any) {
      console.warn('[VAC-SPA] Daemon discovery failed:', err);
      setProbeError(err.message || 'DISCOVERY_FAILED');
      setConnState('DISCONNECTED');
    } finally {
      setProbing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(runDiscovery, 20);
    return () => {
      clearTimeout(timer);
      rpcClientRef.current?.disconnect();
    };
  }, []);

  // Frame to Timecode formatter (HH:MM:SS:FF)
  const formatTimecode = (frame: number) => {
    const totalSeconds = Math.floor(frame / fps);
    const ff = String(frame % fps).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    const mm = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    return `${hh}:${mm}:${ss}:${ff}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0b0e] text-slate-200 select-none overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-[#232733] bg-[#12141a] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-sm shadow-blue-500/50">
              V
            </div>
            <span className="font-bold tracking-tight text-white text-sm">VAC Studio</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              v1.0.0-alpha
            </span>
          </div>

          <div className="h-4 w-px bg-[#232733]" />

          {/* Engine Selector */}
          <div className="flex items-center bg-[#181b23] rounded-md p-0.5 border border-[#232733] text-xs">
            <button
              onClick={() => setActiveEngine('remotion')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeEngine === 'remotion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Remotion (React)
            </button>
            <button
              onClick={() => setActiveEngine('hyperframes')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeEngine === 'hyperframes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              HyperFrames (HTML)
            </button>
            <button
              onClick={() => setActiveEngine('motion2code')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeEngine === 'motion2code' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              motion2code (SVG)
            </button>
          </div>
        </div>

        {/* Center: Clock Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-[#181b23] border border-[#232733] px-3 py-1 rounded-md text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Clock:</span>
            <span className="text-emerald-400 font-semibold">WebAudio 48kHz</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Phase RMS:</span>
            <span className="text-emerald-400 font-bold">0.909ms</span>
          </div>
        </div>

        {/* Right: Daemon Connection Badge */}
        <div className="flex items-center space-x-3">
          {probing ? (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Probing [9720..9740]...</span>
            </div>
          ) : connState === 'CONNECTED' && discovery ? (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Port {discovery.port} Connected</span>
              <span className="text-emerald-500 font-mono text-[10px]">({discovery.latencyMs}ms)</span>
            </div>
          ) : (
            <button
              onClick={runDiscovery}
              title={probeError || 'Click to retry discovery'}
              className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60 text-xs transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Daemon Offline (Retry)</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#232733]" />

          <button className="flex items-center space-x-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-sm shadow-blue-600/30">
            <Download className="w-3.5 h-3.5" />
            <span>Render</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (3-Column Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Dock: Armory / Library */}
        <aside className="w-64 border-r border-[#232733] bg-[#12141a] flex flex-col shrink-0">
          <div className="flex border-b border-[#232733] text-xs">
            <button
              onClick={() => setActiveTab('armory')}
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-all ${
                activeTab === 'armory' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Armory
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-all ${
                activeTab === 'templates' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('sounds')}
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-all ${
                activeTab === 'sounds' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Earshot
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {activeTab === 'armory' && (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Motion Primitives
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] hover:border-blue-500/50 cursor-pointer transition-colors group">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-400">Swiss Bento</div>
                    <div className="text-[10px] text-slate-500 mt-1">4-cell adaptive grid</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] hover:border-blue-500/50 cursor-pointer transition-colors group">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-400">Kinetic Text</div>
                    <div className="text-[10px] text-slate-500 mt-1">Waterfall stagger</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] hover:border-blue-500/50 cursor-pointer transition-colors group">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-400">Vector Loop</div>
                    <div className="text-[10px] text-slate-500 mt-1">60fps SVG morph</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] hover:border-blue-500/50 cursor-pointer transition-colors group">
                    <div className="font-semibold text-slate-200 group-hover:text-blue-400">UI Pointer</div>
                    <div className="text-[10px] text-slate-500 mt-1">Oversized macOS</div>
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 pt-2">
                  Active Compositions
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-blue-950/30 border border-blue-900/60 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-200">MainTimeline.tsx</div>
                      <div className="text-[10px] text-blue-400/80">Remotion Root Composition</div>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-900/50 px-1 rounded text-blue-300">15.0s</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'sounds' && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Earshot Sound Bank (252)
                </div>
                {['ui_click_subtle.wav', 'whoosh_fast_riser.wav', 'sub_drop_heavy.wav', 'kinetic_text_tick.wav'].map((sfx) => (
                  <div key={sfx} className="p-2 rounded bg-[#181b23] border border-[#232733] flex items-center justify-between hover:border-slate-600 cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Music className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-300">{sfx}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">-14 LUFS</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Stage: Viewport & Canvas */}
        <main className="flex-1 flex flex-col bg-[#0a0b0e] overflow-hidden">
          {/* Viewport Top Toolbar */}
          <div className="h-9 border-b border-[#232733] bg-[#12141a]/60 px-4 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-3 text-slate-400">
              <span>Preview: <strong className="text-slate-200">1920 × 1080 (16:9)</strong></span>
              <span>Gamut: <strong className="text-emerald-400">bt.709</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSafeGuides(!showSafeGuides)}
                className={`p-1 rounded hover:bg-[#1f232e] transition-colors ${showSafeGuides ? 'text-blue-400' : 'text-slate-500'}`}
                title="Toggle Safe Guides"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewport Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
            <div
              data-testid="vac-canvas-ready"
              className="relative aspect-video w-full max-w-4xl bg-black rounded border border-[#232733] shadow-2xl flex items-center justify-center overflow-hidden"
              style={{ maxHeight: 'calc(100% - 20px)' }}
            >
              {/* Safe Guides Overlay */}
              {showSafeGuides && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Action Safe (90%) */}
                  <div className="absolute inset-[5%] border border-dashed border-blue-500/25" />
                  {/* Title Safe (80%) */}
                  <div className="absolute inset-[10%] border border-dashed border-amber-500/25" />
                  {/* Center Crosshair */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                </div>
              )}

              {/* Engine Switcher Stage Container */}
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-black/60 text-slate-400 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping mr-2" />
                    Mounting Dual Engine Viewport...
                  </div>
                }
              >
                {engineReady && activeEngine === 'remotion' && (
                  <RemotionHost
                    currentFrame={currentFrame}
                    isPlaying={isPlaying}
                    onFrameUpdate={setCurrentFrame}
                  />
                )}

                {engineReady && activeEngine === 'hyperframes' && (
                  <HyperFramesHost
                    currentFrame={currentFrame}
                    isPlaying={isPlaying}
                    onFrameUpdate={setCurrentFrame}
                  />
                )}
              </Suspense>

              {activeEngine === 'motion2code' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-black">
                  <div className="text-center space-y-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono tracking-widest uppercase">
                      motion2code SVG Engine
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white max-w-lg">
                      Deterministic Vector Loop Preview
                    </h1>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      60fps SVG morphing and GSAP timeline synchronization.
                    </p>
                  </div>
                  <div className="absolute bottom-6 right-8 text-[11px] font-mono text-slate-500 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>FRAME {currentFrame} / {totalFrames}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Viewport Transport Controls */}
          <div className="h-12 border-t border-[#232733] bg-[#12141a] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentFrame(0)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f232e]"
                title="Return to Start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f232e]"
                title="Step Back 1 Frame"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrentFrame(Math.min(totalFrames, currentFrame + 1))}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f232e]"
                title="Step Forward 1 Frame"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Timecode & Frame Counter */}
            <div className="flex items-center space-x-3 font-mono text-sm bg-[#181b23] border border-[#232733] px-3 py-1 rounded">
              <span className="text-white font-bold">{formatTimecode(currentFrame)}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{formatTimecode(totalFrames)}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
                {currentFrame}f
              </span>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Zoom</span>
              <input
                type="range"
                min="50"
                max="200"
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(Number(e.target.value))}
                className="w-20 accent-blue-500"
              />
              <span className="font-mono w-8">{timelineZoom}%</span>
            </div>
          </div>
        </main>

        {/* Right Panel: Anti-Slop HUD & Verification Gate */}
        <aside className="w-72 border-l border-[#232733] bg-[#12141a] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#232733] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Anti-Slop Gate
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              19 / 19 PASS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Metric Box: Phase Jitter */}
            <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>Phase Jitter RMS</span>
                <span className="font-mono text-emerald-400 font-bold">0.909 ms</span>
              </div>
              <div className="w-full bg-[#12141a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '26%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Observed: 0.9ms</span>
                <span>Threshold: ≤ 3.5ms</span>
              </div>
            </div>

            {/* Metric Box: Loudness */}
            <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>Integrated Loudness</span>
                <span className="font-mono text-emerald-400 font-bold">-14.2 LUFS</span>
              </div>
              <div className="w-full bg-[#12141a] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '71%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>ITU-R BS.1770</span>
                <span>Target: -14.0 ±0.5</span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Hard Bans Compliance
              </div>
              {[
                { id: 'HB1', title: 'Zero Black Frame Flash', pass: true },
                { id: 'HB2', title: 'Rec.709 Color Gamut Clamp', pass: true },
                { id: 'HB4', title: 'Vector Seam Continuity', pass: true },
                { id: 'HB12', title: 'True Motion Blur Muxing', pass: true },
                { id: 'HB19', title: 'Audio Psychoacoustic Offset', pass: true },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-1.5 rounded bg-[#181b23]/60 border border-[#232733]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 font-mono text-[11px]">{item.id}</span>
                    <span className="text-slate-400 text-[11px]">{item.title}</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400">OK</span>
                </div>
              ))}
            </div>

            {/* AST Sync Status */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                MotionIR AST Bridge
              </div>
              <div className="p-2.5 rounded bg-[#181b23] border border-[#232733] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Managed Range:</span>
                  <span className="font-mono text-blue-400 text-[11px]">L14-L62</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Diff Status:</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">Clean (No drift)</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Dock: 5-Track Precision Timeline */}
      <footer className="h-44 border-t border-[#232733] bg-[#12141a] flex flex-col shrink-0">
        {/* Timeline Header & Scale */}
        <div className="h-7 border-b border-[#232733] bg-[#181b23] flex items-center px-4 justify-between text-xs font-mono text-slate-500">
          <div className="w-36 shrink-0 font-sans text-slate-400 font-medium">Track Header</div>
          <div className="flex-1 flex justify-between px-2 text-[10px]">
            <span>00:00</span>
            <span>00:03</span>
            <span>00:06</span>
            <span>00:09</span>
            <span>00:12</span>
            <span>00:15</span>
          </div>
        </div>

        {/* 5-Track List */}
        <div className="flex-1 overflow-y-auto font-mono text-xs">
          {/* Track 1: Video / Scene Compositions */}
          <div className="h-7 border-b border-[#232733]/50 flex items-center hover:bg-[#181b23]/40">
            <div className="w-36 px-4 shrink-0 flex items-center space-x-2 text-slate-400 font-sans text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Scene Comp</span>
            </div>
            <div className="flex-1 h-5 mx-2 bg-[#181b23] rounded relative overflow-hidden flex">
              <div className="w-[30%] bg-blue-900/60 border border-blue-500/50 rounded-l px-2 flex items-center text-[10px] text-blue-200">
                Scene_01 (Intro)
              </div>
              <div className="w-[45%] bg-indigo-900/60 border border-indigo-500/50 px-2 flex items-center text-[10px] text-indigo-200">
                Scene_02 (Hero Showcase)
              </div>
              <div className="w-[25%] bg-purple-900/60 border border-purple-500/50 rounded-r px-2 flex items-center text-[10px] text-purple-200">
                Scene_03 (CTA)
              </div>
            </div>
          </div>

          {/* Track 2: Motion FX & Keyframes */}
          <div className="h-7 border-b border-[#232733]/50 flex items-center hover:bg-[#181b23]/40">
            <div className="w-36 px-4 shrink-0 flex items-center space-x-2 text-slate-400 font-sans text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Motion Keyframes</span>
            </div>
            <div className="flex-1 h-5 mx-2 bg-[#181b23] rounded relative overflow-hidden flex">
              <div className="w-[20%] ml-[10%] bg-amber-900/60 border border-amber-500/50 rounded px-2 flex items-center text-[10px] text-amber-200">
                Bento Pop-in
              </div>
              <div className="w-[25%] ml-[15%] bg-amber-900/60 border border-amber-500/50 rounded px-2 flex items-center text-[10px] text-amber-200">
                Kinetic Waterfall
              </div>
            </div>
          </div>

          {/* Track 3: BGM Audio Bed */}
          <div className="h-7 border-b border-[#232733]/50 flex items-center hover:bg-[#181b23]/40">
            <div className="w-36 px-4 shrink-0 flex items-center space-x-2 text-slate-400 font-sans text-xs">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>BGM Bed</span>
            </div>
            <div className="flex-1 h-5 mx-2 bg-[#181b23] rounded relative overflow-hidden">
              <div className="w-full h-full bg-emerald-950/60 border border-emerald-600/50 rounded px-2 flex items-center text-[10px] text-emerald-300">
                ambient_bed_120bpm.wav (-14 LUFS)
              </div>
            </div>
          </div>

          {/* Track 4: Earshot SFX */}
          <div className="h-7 border-b border-[#232733]/50 flex items-center hover:bg-[#181b23]/40">
            <div className="w-36 px-4 shrink-0 flex items-center space-x-2 text-slate-400 font-sans text-xs">
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Earshot SFX</span>
            </div>
            <div className="flex-1 h-5 mx-2 bg-[#181b23] rounded relative overflow-hidden flex items-center">
              <div className="w-8 ml-[10%] h-4 bg-rose-900/80 border border-rose-500/60 rounded text-[9px] flex items-center justify-center text-rose-200">
                Hit
              </div>
              <div className="w-12 ml-[22%] h-4 bg-rose-900/80 border border-rose-500/60 rounded text-[9px] flex items-center justify-center text-rose-200">
                Riser
              </div>
              <div className="w-8 ml-[30%] h-4 bg-rose-900/80 border border-rose-500/60 rounded text-[9px] flex items-center justify-center text-rose-200">
                Tick
              </div>
            </div>
          </div>

          {/* Track 5: Subtitles & Captions */}
          <div className="h-7 flex items-center hover:bg-[#181b23]/40">
            <div className="w-36 px-4 shrink-0 flex items-center space-x-2 text-slate-400 font-sans text-xs">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Captions</span>
            </div>
            <div className="flex-1 h-5 mx-2 bg-[#181b23] rounded relative overflow-hidden flex">
              <div className="w-[28%] ml-[2%] bg-cyan-950/70 border border-cyan-600/50 rounded px-2 flex items-center text-[10px] text-cyan-300">
                "Deterministic Code-to-Video"
              </div>
              <div className="w-[35%] ml-[5%] bg-cyan-950/70 border border-cyan-600/50 rounded px-2 flex items-center text-[10px] text-cyan-300">
                "Phase-locked WebAudio timing"
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

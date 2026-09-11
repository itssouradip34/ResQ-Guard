import React from 'react';
import {
  Cpu, Layers, Zap, Shield, Video, Server, Database,
  ArrowRight, CheckCircle2, Clock, Ambulance, Radio, Code2
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

export const HowItWorksView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#061224] via-[#091f3b] to-[#061224] border border-cyan-500/40 p-6 rounded-2xl shadow-[0_0_35px_rgba(0,229,255,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-mono font-extrabold text-white tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            HOW DOES RESQ-GUARD & LANEZY ARCHITECTURE WORK?
          </h2>
          <p className="text-xs font-mono text-cyan-300 mt-1">
            End-to-End Deep Learning, Spatial-Temporal Trajectory Graph, and Adaptive IoT Signal Automation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
            ENTERPRISE CITY-WIDE PLATFORM
          </span>
        </div>
      </div>

      {/* 4 Core Pillars of Problem Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard glow="cyan" className="p-5 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/40">
            <Video className="w-5 h-5" />
          </div>
          <h4 className="font-mono font-bold text-sm text-white">1. High-Accuracy ANPR & OCR</h4>
          <p className="text-xs font-mono text-slate-300">
            YOLOv8 ByteTrack vehicle & plate detection combined with dual-engine fusion (PaddleOCR + EasyOCR) achieving &gt;90% accuracy across night, rain, blur, and dirty plates.
          </p>
        </GlassCard>

        <GlassCard glow="cyan" className="p-5 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/40">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-mono font-bold text-sm text-white">2. Trajectory Reconstruction</h4>
          <p className="text-xs font-mono text-slate-300">
            Spatial-temporal graph engine that stitches non-overlapping CCTV camera detections into one continuous journey across the city with timestamps, direction, and GIS replay.
          </p>
        </GlassCard>

        <GlassCard glow="cyan" className="p-5 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/40">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-mono font-bold text-sm text-white">3. Macro Traffic Analytics</h4>
          <p className="text-xs font-mono text-slate-300">
            Centralized GIS dashboard computing real-time density heatmaps, Origin-Destination (O-D) movement patterns, bottleneck delays, and Webster adaptive cycle timing.
          </p>
        </GlassCard>

        <GlassCard glow="cyan" className="p-5 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-400/40">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-mono font-bold text-sm text-white">4. Real-Time Alert System</h4>
          <p className="text-xs font-mono text-slate-300">
            Instant flagging of hotlisted stolen vehicles, suspicious loitering, and fake/cloned plate anomalies (impossible travel velocity &gt;160 km/h) with Explainable AI.
          </p>
        </GlassCard>
      </div>

      {/* Step-by-Step System Flow */}
      <GlassCard className="p-6 space-y-6">
        <h3 className="font-mono font-bold text-base text-white flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-cyan-400" />
          STEP-BY-STEP PLATFORM WORKFLOW
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#050d1a] p-4 rounded-xl border border-cyan-900/50 space-y-2">
            <span className="text-2xl">📹</span>
            <h5 className="font-mono font-bold text-xs text-cyan-300">Step 1: Multi-Feed Ingestion</h5>
            <p className="text-[11px] font-mono text-slate-300">
              Live CCTV and RTSP camera streams from multiple sectors are ingested synchronously into per-camera background workers with FPS and heartbeat telemetry.
            </p>
          </div>

          <div className="bg-[#050d1a] p-4 rounded-xl border border-cyan-900/50 space-y-2">
            <span className="text-2xl">🧠</span>
            <h5 className="font-mono font-bold text-xs text-cyan-300">Step 2: Dual-Engine AI Vision</h5>
            <p className="text-[11px] font-mono text-slate-300">
              YOLOv8 locates vehicles and plates. Crops are pre-processed with CLAHE & deskewing, then fed to PaddleOCR + EasyOCR. Confidence fusion guarantees &gt;90% accuracy.
            </p>
          </div>

          <div className="bg-[#050d1a] p-4 rounded-xl border border-cyan-900/50 space-y-2">
            <span className="text-2xl">🗺️</span>
            <h5 className="font-mono font-bold text-xs text-cyan-300">Step 3: Spatial Graph & Trajectory</h5>
            <p className="text-[11px] font-mono text-slate-300">
              Sightings are matched to vehicle dossiers. Historical trajectories are linked across time and space, calculating travel speed and flagging impossible physics.
            </p>
          </div>

          <div className="bg-[#050d1a] p-4 rounded-xl border border-cyan-900/50 space-y-2">
            <span className="text-2xl">🚦</span>
            <h5 className="font-mono font-bold text-xs text-cyan-300">Step 4: Real-Time Signal & SOS</h5>
            <p className="text-[11px] font-mono text-slate-300">
              WebSocket events update live GIS pins. Adaptive controller computes Webster cycle. Emergency vehicles or SOS triggers instant green wave preemption.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Traffic Logic Rules (Lanezy Hallmark) */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-mono font-bold text-base text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          🔁 TRAFFIC LOGIC & SIGNAL AUTOMATION RULES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-amber-400 font-bold uppercase">Core Intersection Rule:</span>
            <p className="text-slate-200 font-bold">Only 1 Lane Green at a Time</p>
            <p className="text-slate-400 text-[11px]">
              Guarantees zero collision conflict at multi-way junctions. Non-active lanes are locked to RED.
            </p>
          </div>

          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-cyan-400 font-bold uppercase">Adaptive Timing:</span>
            <p className="text-slate-200 font-bold">Webster Minimum-Delay Formula</p>
            <p className="text-slate-400 text-[11px]">
              Green split is proportional to lane vehicle density (g_i = (y_i / Y) * (C - L)). High-traffic lanes get longer clearance times.
            </p>
          </div>

          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-rose-400 font-bold uppercase">Emergency Preemption:</span>
            <p className="text-slate-200 font-bold">ResQRoute 2.0 Priority Override</p>
            <p className="text-slate-400 text-[11px]">
              Approaching emergency vehicles immediately force the green phase on their corridor, cutting ambulance transit times by up to 51.7%.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Tech Stack Details */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-mono font-bold text-base text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          🏗️ COMPLETE TECHNOLOGY STACK
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">COMPUTER VISION</span>
            <span className="text-cyan-300 font-bold">YOLOv8 + ByteTrack</span>
            <p className="text-slate-500 text-[10px] mt-1">Vehicle detection & multi-object tracking</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">OCR ENGINE</span>
            <span className="text-emerald-300 font-bold">PaddleOCR + EasyOCR</span>
            <p className="text-slate-500 text-[10px] mt-1">Dual-engine fusion &gt;90% accuracy</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">BACKEND API</span>
            <span className="text-blue-300 font-bold">FastAPI + Asyncio</span>
            <p className="text-slate-500 text-[10px] mt-1">High-concurrency spatial intelligence</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">STREAMING BUS</span>
            <span className="text-amber-300 font-bold">WebSockets & Pub/Sub</span>
            <p className="text-slate-500 text-[10px] mt-1">Sub-second live feed and alert delivery</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">GIS MAPPING</span>
            <span className="text-cyan-300 font-bold">Leaflet & OpenStreetMap</span>
            <p className="text-slate-500 text-[10px] mt-1">100% free, dark tactical basemap</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">DATABASE</span>
            <span className="text-purple-300 font-bold">PostgreSQL / SQLite</span>
            <p className="text-slate-500 text-[10px] mt-1">Spatial geometry & vehicle event storage</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">FRONTEND</span>
            <span className="text-pink-300 font-bold">React 19 + TypeScript</span>
            <p className="text-slate-500 text-[10px] mt-1">TailwindCSS, Lucide & Recharts</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">HARDWARE IOT</span>
            <span className="text-rose-300 font-bold">ESP8266 Wi-Fi / Arduino</span>
            <p className="text-slate-500 text-[10px] mt-1">Physical signal LED controllers</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

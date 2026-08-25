import React, { useState } from 'react';
import {
  Ambulance, Zap, Clock, Shield, Navigation, Play, Pause,
  CheckCircle2, Flame, ArrowRight, Activity
} from 'lucide-react';
import { ResQRouteScenario } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

interface ResQRoutePanelProps {
  scenario: ResQRouteScenario | null;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onViewOnMap: () => void;
}

export const ResQRoutePanel: React.FC<ResQRoutePanelProps> = ({
  scenario,
  isSimulating,
  onToggleSimulation,
  onViewOnMap
}) => {
  if (!scenario) return null;

  const normal = scenario.normal_route;
  const opt = scenario.optimized_resq_corridor;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard glow="green" className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Ambulance className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-mono text-slate-100">
                  ResQRoute 2.0 EMERGENCY GREEN CORRIDOR (F-21 & F-22)
                </h3>
                <StatusPill status="online" label="PREEMPTIVE SIGNALS READY" />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                AI congestion-weighted shortest path with dynamic green wave traffic signal clearance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleSimulation}
              className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                isSimulating
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'PAUSE AMBULANCE DISPATCH' : 'DISPATCH EMERGENCY AMBULANCE'}
            </button>

            <button
              onClick={onViewOnMap}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-mono font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
              MAP CORRIDOR VIEW
            </button>
          </div>
        </div>

        {/* Route Endpoints Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500">ORIGIN PICKUP LOCATION</span>
            <p className="font-bold text-slate-200">{scenario.origin.name}</p>
            <p className="text-slate-400 text-[11px]">GPS: {scenario.origin.lat}, {scenario.origin.lng}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500">EMERGENCY DESTINATION HOSPITAL</span>
            <p className="font-bold text-emerald-300">{scenario.destination.name}</p>
            <p className="text-slate-400 text-[11px]">GPS: {scenario.destination.lat}, {scenario.destination.lng}</p>
          </div>
        </div>
      </GlassCard>

      {/* Before vs After Optimization Comparison Card (FR-22.2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Normal Unassisted Route */}
        <GlassCard glow="amber" className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">BASELINE TRANSIT</span>
              <h4 className="text-sm font-bold font-mono text-slate-200">STANDARD TRAFFIC ROUTE</h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
              UNASSISTED
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ESTIMATED TRANSIT TIME:</span>
              <span className="text-amber-400 font-extrabold text-base">{normal.estimated_time_min} mins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">AVERAGE SPEED:</span>
              <span className="text-slate-200">{normal.average_speed_kmh} km/h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">CONGESTION DELAY IMPACT:</span>
              <span className="text-rose-400 font-bold">+{normal.congestion_delay_min} mins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">INTERSECTIONS ENCOUNTERED:</span>
              <span className="text-slate-200">{normal.signals_encountered} signals ({normal.signals_delayed} red delays)</span>
            </div>
          </div>
        </GlassCard>

        {/* ResQRoute 2.0 Green Corridor */}
        <GlassCard glow="green" className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">AI OPTIMIZED</span>
              <h4 className="text-sm font-bold font-mono text-emerald-300">ResQ GREEN WAVE CORRIDOR</h4>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-xs font-mono font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              -{opt.time_saved_pct}% FASTER
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">OPTIMIZED TRANSIT TIME:</span>
              <span className="text-emerald-400 font-extrabold text-base">{opt.estimated_time_min} mins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">CRITICAL TIME SAVED:</span>
              <span className="text-cyan-300 font-extrabold text-base">-{opt.time_saved_min} mins saved</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">CORRIDOR CLEAR SPEED:</span>
              <span className="text-emerald-300 font-bold">{opt.average_speed_kmh} km/h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">GREEN WAVE CLEARANCE:</span>
              <span className="text-emerald-400 font-bold">{opt.signals_cleared_green} of {opt.signals_encountered} locked green</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Cleared Intersections Grid */}
      {opt.cleared_intersections && (
        <GlassCard className="p-5 space-y-4">
          <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            DYNAMIC TRAFFIC SIGNAL GREEN-LOCK CONTROLLERS (F-21.2)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {opt.cleared_intersections.map((sig, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{sig.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/40">
                    GREEN LOCKED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">NODE: {sig.camera_id} • Priority Phase 1</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

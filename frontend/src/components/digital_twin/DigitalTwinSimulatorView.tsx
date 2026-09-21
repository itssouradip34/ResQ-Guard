import React, { useState, useEffect } from 'react';
import { Cpu, Play, BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Sliders, MapPin } from 'lucide-react';
import { Camera } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';

export const DigitalTwinSimulatorView: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [scenarioTypes, setScenarioTypes] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('add_green_time');
  const [greenDelta, setGreenDelta] = useState<number>(15);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load live camera junctions and scenario templates
    Promise.all([
      api.getCameras().catch(() => []),
      api.getDigitalTwinScenarios().catch(() => [])
    ]).then(([cams, scens]) => {
      setCameras(cams);
      if (cams.length > 0) setSelectedCamera(cams[0]);
      setScenarioTypes(scens);
      if (scens.length > 0) setSelectedScenarioId(scens[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedCamera && selectedScenarioId) {
      runSimulation();
    }
  }, [selectedCamera, selectedScenarioId, greenDelta]);

  const runSimulation = async () => {
    if (!selectedCamera) return;
    setIsLoading(true);
    try {
      const res = await api.simulateJunction(selectedCamera.id, selectedScenarioId, greenDelta);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedScenarioMeta = scenarioTypes.find(s => s.id === selectedScenarioId) || {
    id: selectedScenarioId,
    name: 'Dynamic Signal Optimization',
    description: 'Models dynamic traffic signal adjustment.'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081322] p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            DIGITAL TWIN / WHAT-IF TRAFFIC SIMULATION (F-23)
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Evaluate signal timings and corridor capacity modifications live with the Webster/HCM model
          </p>
        </div>
      </div>

      {/* Junction & Camera Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          SELECT TARGET SURVEILLANCE JUNCTION NODE:
        </label>
        <div className="flex flex-wrap gap-2">
          {cameras.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setSelectedCamera(cam)}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold border transition-all text-left ${
                selectedCamera?.id === cam.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cam.name} ({cam.zone})
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Selector Chips */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          SELECT SIMULATION STRATEGY:
        </label>
        <div className="flex flex-wrap gap-2">
          {scenarioTypes.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all text-left ${
                selectedScenarioId === sc.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sc.name || sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Deep Dive & Live Webster Metrics */}
      {selectedCamera && simResult && (
        <GlassCard glow="cyan" className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                TARGET JUNCTION: {selectedCamera.name} ({selectedCamera.road_segment || selectedCamera.zone})
              </span>
              <h3 className="text-base font-extrabold font-mono text-slate-100 mt-1">
                {selectedScenarioMeta.name || selectedScenarioMeta.label}
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                {selectedScenarioMeta.description}
              </p>
            </div>

            {selectedScenarioId === 'add_green_time' && (
              <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-300">Green Extension: +{greenDelta}s</span>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={greenDelta}
                  onChange={(e) => setGreenDelta(Number(e.target.value))}
                  className="accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Before vs After Metric Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average Delay */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">AVERAGE VEHICLE DELAY</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-slate-400 text-xs line-through">{simResult.baseline_avg_delay_sec}s</p>
                  <p className="text-xl font-extrabold text-cyan-300">{simResult.scenario_avg_delay_sec}s</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  simResult.delay_improvement_pct >= 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {simResult.delay_improvement_pct >= 0 ? '-' : '+'}
                  {Math.abs(simResult.delay_improvement_pct)}%
                </span>
              </div>
            </div>

            {/* Input Volume */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">PREDICTED APPROACH VOLUME</span>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-slate-400 text-xs">{simResult.input_volume_veh_per_hr} veh/h</p>
                  <p className="text-xl font-extrabold text-amber-300">
                    {Math.round((simResult.input_volume_veh_per_hr / (simResult.assumptions?.capacity_per_lane_veh_hr * simResult.assumptions?.lanes_assumed || 3600)) * 100)}% v/c
                  </p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-300">
                  {simResult.assumptions?.lanes_assumed || 2} Lanes
                </span>
              </div>
            </div>

            {/* Capacity Model */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">MODEL FORMULATION</span>
              <div>
                <p className="text-slate-200 text-xs font-bold">Webster Delay Equation</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  Cycle: {simResult.assumptions?.baseline_cycle_length_sec || 90}s | Cap: {simResult.assumptions?.capacity_per_lane_veh_hr || 1800} vphpl
                </p>
              </div>
            </div>
          </div>

          {/* AI Municipal Recommendation */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 font-mono text-xs">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
              <span className="text-cyan-300 font-bold">DIGITAL TWIN MUNICIPAL RECOMMENDATION:</span>
              <p className="text-slate-200 mt-0.5">
                Applying {selectedScenarioMeta.name || selectedScenarioMeta.label} to {selectedCamera.name} yields an estimated {Math.abs(simResult.delay_improvement_pct)}% reduction in vehicle idling and reduces junction queuing by ~{Math.round(Math.abs(simResult.delay_improvement_pct) * 1.4)} meters during peak hours.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

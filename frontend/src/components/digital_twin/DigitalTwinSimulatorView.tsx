import React, { useState, useEffect } from 'react';
import { Cpu, Play, BarChart2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DigitalTwinScenario } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';

export const DigitalTwinSimulatorView: React.FC = () => {
  const [scenarios, setScenarios] = useState<DigitalTwinScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<DigitalTwinScenario | null>(null);

  useEffect(() => {
    api.getDigitalTwinScenarios().then((data) => {
      setScenarios(data);
      if (data.length > 0) setSelectedScenario(data[0]);
    }).catch(console.error);
  }, []);

  if (!selectedScenario) return null;

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
            Evaluate junction modifications, signal phase shifts, and lane closures before city deployment
          </p>
        </div>
      </div>

      {/* Scenario Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelectedScenario(sc)}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all text-left ${
              selectedScenario.id === sc.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sc.name}
          </button>
        ))}
      </div>

      {/* Scenario Deep Dive */}
      <GlassCard glow="cyan" className="p-6 space-y-6">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
            JUNCTION NODE: {selectedScenario.junction_name} ({selectedScenario.junction_id})
          </span>
          <h3 className="text-base font-extrabold font-mono text-slate-100 mt-1">
            {selectedScenario.name}
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 font-mono">
            {selectedScenario.description}
          </p>
        </div>

        {/* Before vs After Metric Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Delay Metric */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">AVERAGE VEHICLE DELAY</span>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-slate-400 text-xs line-through">{selectedScenario.current_metrics.avg_delay_sec}s</p>
                <p className="text-xl font-extrabold text-cyan-300">{selectedScenario.simulated_metrics.avg_delay_sec}s</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                selectedScenario.delta_percentage.delay_reduction < 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {selectedScenario.delta_percentage.delay_reduction > 0 ? '+' : ''}
                {selectedScenario.delta_percentage.delay_reduction}%
              </span>
            </div>
          </div>

          {/* Queue Length */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">PEAK QUEUE LENGTH</span>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-slate-400 text-xs line-through">{selectedScenario.current_metrics.queue_length_m}m</p>
                <p className="text-xl font-extrabold text-amber-300">{selectedScenario.simulated_metrics.queue_length_m}m</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                selectedScenario.delta_percentage.queue_reduction < 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {selectedScenario.delta_percentage.queue_reduction > 0 ? '+' : ''}
                {selectedScenario.delta_percentage.queue_reduction}%
              </span>
            </div>
          </div>

          {/* Hourly Throughput */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">HOURLY THROUGHPUT</span>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-slate-400 text-xs line-through">{selectedScenario.current_metrics.hourly_throughput} veh/h</p>
                <p className="text-xl font-extrabold text-emerald-300">{selectedScenario.simulated_metrics.hourly_throughput} veh/h</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                selectedScenario.delta_percentage.throughput_gain > 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {selectedScenario.delta_percentage.throughput_gain > 0 ? '+' : ''}
                {selectedScenario.delta_percentage.throughput_gain}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Municipal Recommendation */}
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="text-cyan-300 font-bold">DIGITAL TWIN RECOMMENDATION:</span>
            <p className="text-slate-200 mt-0.5">{selectedScenario.recommendation}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

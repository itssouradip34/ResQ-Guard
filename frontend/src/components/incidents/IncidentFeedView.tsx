import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, ArrowRight, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { Incident } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

export const IncidentFeedView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (filterType !== 'all' && inc.incident_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081322] p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            AI RULE-BASED TRAFFIC INCIDENT FEED (F-12)
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Automated detection for stalled vehicles, wrong-way transit, and rapid collision deceleration
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {['all', 'stopped_too_long', 'wrong_direction', 'sudden_deceleration'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded text-[11px] uppercase transition-all ${
                filterType === t
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Incidents' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inc) => (
          <GlassCard
            key={inc.id}
            glow={inc.severity === 'critical' ? 'red' : 'amber'}
            className="p-5 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <StatusPill status={inc.severity as any} />
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(inc.created_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-sm text-cyan-300">
                  {inc.incident_type.toUpperCase().replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {inc.camera_name || inc.camera_id}
                </span>
              </div>

              {inc.vehicle_plate && (
                <div className="text-xs font-mono text-slate-300">
                  Target: <span className="font-bold text-white px-1.5 py-0.5 rounded bg-black border border-cyan-500/30">{inc.vehicle_plate}</span>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                {inc.details}
              </p>

              {inc.evidence_url && (
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black mt-2">
                  <img src={inc.evidence_url} alt="Evidence" className="w-full h-32 object-cover" />
                  <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                    EVIDENCE SNAPSHOT
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span>AI Confidence: <span className="text-emerald-400 font-bold">{Math.round(inc.confidence * 100)}%</span></span>
              <span className="text-cyan-400 font-bold">STATUS: LOGGED</span>
            </div>
          </GlassCard>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 font-mono text-sm">
            No incidents detected matching current filter.
          </div>
        )}
      </div>
    </div>
  );
};

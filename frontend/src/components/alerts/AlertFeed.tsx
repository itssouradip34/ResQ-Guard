import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle, Search, Filter, Sparkles } from 'lucide-react';
import { Alert } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { GlassCard } from '../common/GlassCard';

interface AlertFeedProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  onAcknowledge: (alertId: string) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  onSelectAlert,
  onAcknowledge
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType !== 'all' && a.alert_type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (a.plate_text && a.plate_text.toLowerCase().includes(term)) ||
        a.message.toLowerCase().includes(term) ||
        (a.camera_name && a.camera_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081322] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search alerts by plate number, location, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['all', 'blacklist_hit', 'suspicious_route', 'fake_plate_suspected'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
                  filterType === t
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'All' : t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAlerts.map((alt) => (
          <GlassCard
            key={alt.id}
            glow={alt.severity === 'critical' ? 'red' : alt.severity === 'high' ? 'amber' : 'none'}
            className="p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <StatusPill status={alt.severity} />
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(alt.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-extrabold text-sm text-cyan-300">
                  {alt.plate_text || 'FLAGGED VEHICLE'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {alt.camera_name || alt.camera_id}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">
                {alt.message}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onSelectAlert(alt)}
                className="flex-1 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                EXPLAIN (XAI)
              </button>

              {!alt.acknowledged ? (
                <button
                  onClick={() => onAcknowledge(alt.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition-all"
                >
                  ACK
                </button>
              ) : (
                <span className="px-2 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ACK'D
                </span>
              )}
            </div>
          </GlassCard>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-mono text-sm">
            No alerts matching current filter parameters.
          </div>
        )}
      </div>
    </div>
  );
};

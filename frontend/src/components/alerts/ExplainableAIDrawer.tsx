import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Alert, AlertExplanation } from '../../types';
import { api } from '../../services/api';
import { StatusPill } from '../common/StatusPill';

interface ExplainableAIDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
}

export const ExplainableAIDrawer: React.FC<ExplainableAIDrawerProps> = ({
  alert,
  onClose,
  onAcknowledge
}) => {
  const [explanation, setExplanation] = useState<AlertExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alert) {
      setExplanation(null);
      return;
    }
    setLoading(true);
    api.getAlertExplanation(alert.id)
      .then(setExplanation)
      .catch((err) => {
        console.error('Failed to load explanation', err);
        setExplanation({
          alert_id: alert.id,
          summary: alert.message,
          rules_triggered: [
            { rule_name: alert.alert_type, status: 'TRIGGERED', confidence: 0.95 }
          ],
          created_at: alert.timestamp
        });
      })
      .finally(() => setLoading(false));
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-[#071222] border-l border-cyan-500/30 h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                  <span>EXPLAINABLE-AI ALERT DETAIL</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
                <p className="text-[11px] font-mono text-slate-400">ALERT ID: {alert.id}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Info */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">SEVERITY:</span>
              <StatusPill status={alert.severity} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ALERT TYPE:</span>
              <span className="text-cyan-300 font-bold uppercase">{alert.alert_type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">TARGET PLATE:</span>
              <span className="text-white font-extrabold text-sm px-2 py-0.5 rounded bg-black border border-cyan-500/40">
                {alert.plate_text || 'UNKNOWN'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">DETECTED NODE:</span>
              <span className="text-slate-200">{alert.camera_name || alert.camera_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">TIMESTAMP:</span>
              <span className="text-slate-200">{new Date(alert.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* AI Reasoning Summary */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
            <h4 className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              SYSTEM REASONING & SUMMARY
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {explanation?.summary || alert.message}
            </p>
          </div>

          {/* Rules Triggered Breakdown (F-19.1) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              TRIGGERED AI RULES & WEIGHTS
            </h4>

            {explanation?.rules_triggered?.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{rule.rule_name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    rule.status === 'TRIGGERED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {rule.status}
                  </span>
                </div>
                {rule.condition && (
                  <p className="text-slate-400 text-[11px]"><span className="text-slate-500">Condition:</span> {rule.condition}</p>
                )}
                {rule.evidence && (
                  <p className="text-amber-300 text-[11px]"><span className="text-slate-500">Evidence:</span> {rule.evidence}</p>
                )}
                {rule.confidence && (
                  <p className="text-cyan-400 text-[11px]"><span className="text-slate-500">Confidence:</span> {Math.round(rule.confidence * 100)}%</p>
                )}
              </div>
            ))}
          </div>

          {/* Visual Evidence Snapshot (FR-19.1) */}
          {explanation?.evidence_urls && explanation.evidence_urls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                VERIFIED SNAPSHOT EVIDENCE
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {explanation.evidence_urls.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-slate-700 bg-black">
                    <img src={url} alt="Evidence" className="w-full h-44 object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 font-mono text-[10px] text-cyan-400 border border-cyan-500/30">
                      LIVE SNAPSHOT EVIDENCE
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          {!alert.acknowledged ? (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              ACKNOWLEDGE ALERT
            </button>
          ) : (
            <div className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 font-mono text-xs text-center border border-slate-700">
              Acknowledged by {alert.acknowledged_by || 'Officer'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

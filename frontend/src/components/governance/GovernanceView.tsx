import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, FileText, CheckCircle2, History } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthRole } from '../../context/AuthRoleContext';
import { GlassCard } from '../common/GlassCard';

export const GovernanceView: React.FC = () => {
  const { role, isAuthority, toggleRole } = useAuthRole();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard glow="cyan" className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-mono text-slate-100 flex items-center gap-2">
                <span>PRIVACY-PRESERVING GOVERNANCE & SECURITY AUDIT (F-16)</span>
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Role-based access control, one-way SHA-256 plate hashing, and tamper-evident audit logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">ACTIVE ROLE:</span>
              <span className="text-cyan-300 font-extrabold uppercase">{role}</span>
            </div>

            <button
              onClick={toggleRole}
              className={`px-4 py-2.5 rounded-xl font-bold border transition-all ${
                isAuthority
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500 hover:bg-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500 hover:bg-amber-500/30'
              }`}
            >
              SWITCH TO {isAuthority ? 'ANALYST (MASKED PLATES)' : 'AUTHORITY (FULL PLATES)'}
            </button>
          </div>
        </div>

        {/* Governance Rules Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>ROLE-BASED PLATE MASKING</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Analysts view masked strings (<code className="text-amber-300">DL01 XX ****</code>). Full plates accessible only to verified police authorities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ONE-WAY SHA-256 HASHING</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Analytics engines and aggregation pipelines compute metrics strictly on hashed identifiers without holding raw PII.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <History className="w-4 h-4" />
              <span>AUDIT TRAIL LOGGING</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Every vehicle search, blacklist mutation, and plate lookup records actor role, target ID, and precise timestamp.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Audit Log Table (FR-16.3) */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            LIVE SECURITY AUDIT LOGS (audit_log)
          </h4>
          <span className="text-xs font-mono text-slate-400">Total Entries: {auditLogs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2">LOG ID</th>
                <th className="pb-2">ACTOR ROLE</th>
                <th className="pb-2">ACTION EXECUTED</th>
                <th className="pb-2">TARGET TYPE</th>
                <th className="pb-2">TARGET ID</th>
                <th className="pb-2">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50">
                  <td className="py-2.5 text-slate-400">#{log.id}</td>
                  <td className="py-2.5 font-bold uppercase text-cyan-400">{log.actor_role}</td>
                  <td className="py-2.5 text-slate-200">{log.action}</td>
                  <td className="py-2.5 text-slate-400 uppercase">{log.target_type}</td>
                  <td className="py-2.5 text-slate-300">{log.target_id || 'N/A'}</td>
                  <td className="py-2.5 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditLogs.length === 0 && (
            <p className="text-center py-10 text-slate-500 font-mono text-xs">
              No audit log entries recorded yet.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

import React from 'react';

interface StatusPillProps {
  status: 'online' | 'degraded' | 'offline' | 'critical' | 'high' | 'medium' | 'low' | 'active' | 'resolved';
  label?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  const styles: Record<string, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    online: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400 animate-pulse',
      defaultLabel: 'ONLINE'
    },
    degraded: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      defaultLabel: 'DEGRADED'
    },
    offline: {
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      defaultLabel: 'OFFLINE'
    },
    critical: {
      bg: 'bg-rose-500/20 border-rose-500/50',
      text: 'text-rose-300 font-bold',
      dot: 'bg-rose-500 animate-ping-slow',
      defaultLabel: 'CRITICAL'
    },
    high: {
      bg: 'bg-amber-500/20 border-amber-500/40',
      text: 'text-amber-300 font-semibold',
      dot: 'bg-amber-400',
      defaultLabel: 'HIGH'
    },
    medium: {
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      text: 'text-cyan-400',
      dot: 'bg-cyan-400',
      defaultLabel: 'MEDIUM'
    },
    low: {
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      defaultLabel: 'LOW'
    },
    active: {
      bg: 'bg-cyan-500/20 border-cyan-500/40',
      text: 'text-cyan-300 font-semibold',
      dot: 'bg-cyan-400 animate-pulse',
      defaultLabel: 'ACTIVE'
    },
    resolved: {
      bg: 'bg-slate-500/10 border-slate-600/30',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      defaultLabel: 'RESOLVED'
    }
  };

  const current = styles[status.toLowerCase()] || styles.online;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${current.bg} ${current.text} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`}></span>
      {label || current.defaultLabel}
    </span>
  );
};

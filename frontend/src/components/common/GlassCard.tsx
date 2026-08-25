import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'red' | 'green' | 'amber' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick
}) => {
  const glowClasses = {
    cyan: 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]',
    red: 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
    green: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    amber: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    none: 'border-slate-800/80 shadow-lg'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#0b1626]/80 backdrop-blur-xl border rounded-xl transition-all duration-300 ${glowClasses[glow]} ${className}`}
    >
      {children}
    </div>
  );
};

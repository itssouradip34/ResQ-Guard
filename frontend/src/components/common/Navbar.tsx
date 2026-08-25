import React, { useState, useEffect } from 'react';
import {
  Shield, Radio, AlertTriangle, Eye, EyeOff, Smartphone,
  Activity, Map, BarChart3, Video, Search, MessageSquare,
  Ambulance, Cpu, FileText, Lock
} from 'lucide-react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { StatusPill } from './StatusPill';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMode: boolean;
  setIsMobileMode: (val: boolean) => void;
  activeAlertsCount: number;
  onOpenAlerts: () => void;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMode,
  setIsMobileMode,
  activeAlertsCount,
  onOpenAlerts,
  isWsConnected
}) => {
  const { role, toggleRole, isAuthority } = useAuthRole();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navTabs = [
    { id: 'map', label: 'GIS Command Map', icon: Map },
    { id: 'vehicles', label: 'Vehicle Intelligence', icon: Search },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'cameras', label: 'Camera Health', icon: Video },
    { id: 'incidents', label: 'AI Incidents', icon: Activity },
    { id: 'assistant', label: 'City Assistant', icon: MessageSquare },
    { id: 'resqroute', label: 'ResQRoute 2.0', icon: Ambulance, highlight: true },
    { id: 'digital_twin', label: 'Digital Twin', icon: Cpu },
    { id: 'citizen', label: 'Citizen Portal', icon: FileText },
    { id: 'governance', label: 'Governance & Audit', icon: Lock }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#060e1b]/95 backdrop-blur-xl border-b border-cyan-900/40 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                ResQ-Guard
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-600/40 text-[10px] font-mono text-cyan-300 font-bold">
                AI ANPR 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>DELHI SURVEILLANCE GRID</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-semibold">{timeStr}</span>
            </p>
          </div>
        </div>

        {/* Desktop Tabs Navigation */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#091525]/80 p-1 rounded-xl border border-slate-800">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,229,255,0.2)] font-semibold'
                    : tab.highlight
                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : tab.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Role Toggle, Mobile Mode, Alert Trigger */}
        <div className="flex items-center gap-2.5">
          {/* WebSocket Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className={isWsConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isWsConnected ? 'LIVE FEED' : 'OFFLINE'}
            </span>
          </div>

          {/* Privacy Role Switcher (F-16) */}
          <button
            onClick={toggleRole}
            title={isAuthority ? "Authority Mode: Full Plate Visibility" : "Analyst Mode: Plates are Masked (MP04 XX ****)"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
              isAuthority
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 hover:bg-blue-500/20'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {isAuthority ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="uppercase">{role}</span>
          </button>

          {/* Mobile Patrol Mode Toggle */}
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isMobileMode
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isMobileMode ? 'Patrol App' : 'Desktop Grid'}</span>
          </button>

          {/* Alert Feed Trigger (F-09) */}
          <button
            onClick={onOpenAlerts}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-500/25 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>ALERTS</span>
            {activeAlertsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-navigation for smaller desktop / tablet screens */}
      <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 border-t border-slate-800/60 mt-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

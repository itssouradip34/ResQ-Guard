import React, { useState, useEffect } from 'react';
import {
  Github, ArrowRight, Shield, Radio, Ambulance, Users,
  Activity, MapPin, Eye, Zap, CheckCircle2, ChevronDown, ExternalLink,
  Code2, AlertTriangle, Video, Sparkles
} from 'lucide-react';

interface LandingPageViewProps {
  onGetStarted: () => void;
  onOpenDashboard: () => void;
  onTriggerSOS: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGetStarted,
  onOpenDashboard,
  onTriggerSOS
}) => {
  const [activeLightIndex, setActiveLightIndex] = useState(0);

  // Animate the 4 miniature traffic lights across the bottom
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLightIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const scrollToTeam = () => {
    const el = document.getElementById('our-team-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const teamMembers = [
    {
      name: 'Dhruv Sharma',
      role: 'Full Stack & AI Architect',
      focus: 'Dual-Engine OCR Fusion & Fast Trajectory Graph',
      avatar: 'DS',
      color: 'from-orange-500 to-amber-500'
    },
    {
      name: 'Kunal Sharma',
      role: 'Computer Vision & AI Lead',
      focus: 'YOLOv8 ByteTrack & Vehicle DNA Embeddings',
      avatar: 'KS',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      name: 'Sakshi Singh',
      role: 'Frontend & GIS Lead',
      focus: 'Command Center HUD & Tactical Leaflet Maps',
      avatar: 'SS',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      name: 'Sangya Ojha',
      role: 'IoT & Cloud Systems',
      focus: 'ESP8266 Traffic Preemption & WebSocket Hub',
      avatar: 'SO',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF9] via-[#FFF6EE] to-[#FEECE0] text-slate-800 font-sans selection:bg-orange-200">
      {/* 1. Top Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 via-red-500 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#181216] rounded-full flex items-center justify-center">
              <span className="text-lg">🚦</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-serif font-black tracking-tight text-[#E8590C]">
              Lanezy
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              ResQ-Guard AI
            </span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-orange-600 transition-colors font-semibold"
          >
            Home
          </button>
          <button
            onClick={onOpenDashboard}
            className="hover:text-orange-600 transition-colors font-semibold flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-orange-500" />
            Dashboard
          </button>
          <button
            onClick={onTriggerSOS}
            className="text-rose-600 hover:text-rose-700 font-bold px-3 py-1 rounded-full bg-rose-50 border border-rose-200 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            SOS
          </button>
          <a
            href="https://github.com/itssouradip34/ResQ-Guard"
            target="_blank"
            rel="noopener noreferrer"
            title="View Source on GitHub"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:text-black transition-all hover:scale-105"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* 2. Hero Section Matching User Screenshot */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        {/* Soft floating background ambient lights */}
        <div className="absolute top-12 left-1/4 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Left Column: Hero Text & CTA Buttons */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-black text-[#EA580C] tracking-tight leading-[1.05]">
              Lanezy
            </h1>
            <div className="w-24 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-transparent rounded-full mt-4 mb-6" />
          </div>

          <p className="text-xl sm:text-2xl text-slate-700 font-normal leading-relaxed max-w-xl">
            Revolutionizing traffic management with{' '}
            <span className="text-orange-600 font-bold">AI-powered vehicle detection</span>{' '}
            and intelligent flow optimization
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-[0_10px_25px_rgba(234,88,12,0.35)] hover:shadow-[0_12px_30px_rgba(234,88,12,0.45)] hover:-translate-y-0.5 transition-all flex items-center gap-2.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={scrollToTeam}
              className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-base border border-slate-200 shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <span>Our Team</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <a
              href="https://github.com/itssouradip34/ResQ-Guard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg">
            <div className="p-3 rounded-xl bg-white/80 border border-orange-200/70 shadow-sm">
              <span className="text-orange-600 font-mono font-bold text-xs block">&gt;90% ACCURACY</span>
              <span className="text-[11px] text-slate-600">Dual-Engine OCR</span>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-orange-200/70 shadow-sm">
              <span className="text-emerald-600 font-mono font-bold text-xs block">GREEN WAVE</span>
              <span className="text-[11px] text-slate-600">Emergency Preemption</span>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-orange-200/70 shadow-sm">
              <span className="text-blue-600 font-mono font-bold text-xs block">GIS TRACKING</span>
              <span className="text-[11px] text-slate-600">Spatial Trajectories</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tablet Device Mockup as in Screenshot */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-xl">
            {/* Tablet Shadow Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 to-amber-300/30 rounded-[2.5rem] blur-2xl transform scale-95" />

            {/* Tablet Outer Hardware Shell */}
            <div className="relative bg-gradient-to-b from-[#1c1d22] via-[#121316] to-[#0a0a0d] p-4 sm:p-5 rounded-[2.5rem] shadow-2xl border-4 border-slate-700/80">
              {/* Tablet Camera & Speaker */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" />
                <div className="w-12 h-1 rounded-full bg-slate-800" />
              </div>

              {/* Screen Content */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600 aspect-[16/10] border border-slate-600/50 shadow-inner flex flex-col justify-between p-4">
                {/* Simulated Street Map Background */}
                <div className="absolute inset-0 bg-[#e5e9ec] opacity-95">
                  <svg className="w-full h-full opacity-70" viewBox="0 0 500 320" fill="none">
                    {/* Road Network */}
                    <path d="M 0 160 Q 250 120 500 200" stroke="#f1f5f9" strokeWidth="36" />
                    <path d="M 0 160 Q 250 120 500 200" stroke="#fde047" strokeWidth="4" strokeDasharray="8 8" />
                    <path d="M 180 0 L 320 320" stroke="#f1f5f9" strokeWidth="28" />
                    <path d="M 180 0 L 320 320" stroke="#fde047" strokeWidth="3" strokeDasharray="6 6" />
                    <path d="M 300 0 Q 340 180 100 320" stroke="#f1f5f9" strokeWidth="24" />

                    {/* Green Preemption Corridor Line */}
                    <path d="M 60 150 Q 240 120 440 210" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />

                    {/* Landmark Buildings */}
                    <rect x="40" y="40" width="70" height="60" rx="4" fill="#cbd5e1" />
                    <rect x="130" y="30" width="40" height="80" rx="4" fill="#94a3b8" />
                    <rect x="360" y="50" width="80" height="70" rx="4" fill="#cbd5e1" />
                    <rect x="40" y="210" width="90" height="80" rx="4" fill="#94a3b8" />
                    <rect x="380" y="220" width="60" height="70" rx="4" fill="#cbd5e1" />
                  </svg>
                </div>

                {/* Tablet App Header */}
                <div className="relative z-10 flex items-center justify-between bg-blue-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-md backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold">Project Lanezy: Emergency Vehicle Tracking & AI Intervention</span>
                  </div>
                  <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded font-bold">LIVE GIS</span>
                </div>

                {/* Map Interactive Nodes & Ambulance */}
                <div className="relative z-10 flex-1 flex items-center justify-center">
                  <div className="absolute top-[35%] left-[55%] flex items-center gap-2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-emerald-400 opacity-60" />
                      <div className="w-9 h-9 rounded-full bg-white shadow-xl border-2 border-emerald-500 flex items-center justify-center text-lg z-10">
                        🚑
                      </div>
                    </div>
                    <div className="bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-lg border border-emerald-500/40">
                      <p className="font-bold text-emerald-400">AMBULANCE (EMS-9)</p>
                      <p className="text-slate-300">Signal Preemption Locked</p>
                    </div>
                  </div>
                </div>

                {/* Tablet Bottom Controls */}
                <div className="relative z-10 bg-slate-900/85 backdrop-blur-md text-white p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">🟢 CORRIDOR CLEAR</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">Target ETA: 4.2 min</span>
                  </div>
                  <button
                    onClick={onGetStarted}
                    className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] transition-all"
                  >
                    OPEN COMMAND CENTER →
                  </button>
                </div>
              </div>

              {/* Tablet Home Bar */}
              <div className="flex justify-center mt-3">
                <div className="w-20 h-1 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Animated Miniature Traffic Lights (Exact Feature from Image) */}
      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center gap-8 sm:gap-14">
        {[0, 1, 2, 3].map((lightIdx) => {
          const isGreenActive = activeLightIndex === lightIdx;
          return (
            <div
              key={lightIdx}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => setActiveLightIndex(lightIdx)}
            >
              {/* Traffic Light Pod */}
              <div className="w-11 sm:w-13 bg-[#1e232d] p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-700 flex flex-col gap-2 items-center hover:scale-110 transition-transform">
                {/* Red Light */}
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all ${
                    !isGreenActive
                      ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-95'
                      : 'bg-rose-950 opacity-30'
                  }`}
                />
                {/* Yellow Light */}
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-950 opacity-20" />
                {/* Green Light */}
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all ${
                    isGreenActive
                      ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)] opacity-100 animate-pulse'
                      : 'bg-emerald-950 opacity-30'
                  }`}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 mt-2 uppercase">
                Lane {lightIdx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Our Team Section */}
      <section id="our-team-section" className="max-w-7xl mx-auto px-6 py-20 border-t border-orange-200/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-mono font-bold">
            <Users className="w-3.5 h-3.5" />
            ENGINEERING & RESEARCH SQUAD
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Our Team
          </h2>
          <p className="text-slate-600 font-normal text-base">
            The dedicated builders behind ResQ-Guard and Lanezy Smart City Traffic & AI ANPR Intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-orange-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all space-y-4"
            >
              {/* Member Avatar */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${member.color} text-white font-mono font-black text-xl flex items-center justify-center shadow-md`}>
                {member.avatar}
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">{member.name}</h3>
                <span className="text-xs font-mono font-bold text-orange-600 block mt-0.5">
                  {member.role}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans border-t border-slate-100 pt-3">
                {member.focus}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. GitHub Repository Showcase Card */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-slate-900 via-[#161f30] to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
              <Code2 className="w-4 h-4" />
              <span>OPEN SOURCE CITY-WIDE ANPR REPO</span>
            </div>
            <h3 className="text-2xl font-serif font-bold">itssouradip34 / ResQ-Guard</h3>
            <p className="text-xs text-slate-400 max-w-md font-mono">
              YOLOv8 + ByteTrack, Dual OCR (Paddle + EasyOCR), Trajectory Reconstructor, and Emergency Preemption.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/itssouradip34/ResQ-Guard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Open on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs border border-white/20 transition-all"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

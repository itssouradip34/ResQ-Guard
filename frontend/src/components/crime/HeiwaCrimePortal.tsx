import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, UserX, Users, Activity, Play, Zap,
  CheckCircle2, Radio, AlertTriangle, RefreshCw, Eye,
  Shield, Compass, Sparkles
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';
import { CrimePoseEvent } from '../../types';
import { api } from '../../services/api';

const KEYPOINT_NAMES = [
  'Nose', 'L Eye', 'R Eye', 'L Ear', 'R Ear',
  'L Shoulder', 'R Shoulder', 'L Elbow', 'R Elbow',
  'L Wrist', 'R Wrist', 'L Hip', 'R Hip',
  'L Knee', 'R Knee', 'L Ankle', 'R Ankle'
];

export const HeiwaCrimePortal: React.FC = () => {
  const [crimeEvents, setCrimeEvents] = useState<CrimePoseEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CrimePoseEvent | null>(null);

  // Simulation Form
  const [simAction, setSimAction] = useState<string>('PHYSICAL_ASSAULT_SLAP');
  const [simCamera, setSimCamera] = useState<string>('cam-02');
  const [simPersons, setSimPersons] = useState<number>(2);

  const loadCrimeEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getCrimeEvents();
      setCrimeEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.error('Failed to load crime events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrimeEvents();
    const interval = setInterval(loadCrimeEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateCrime = async () => {
    setSimulating(true);
    try {
      await api.simulateCrime({
        camera_id: simCamera,
        action_type: simAction,
        person_count: simPersons
      });
      await loadCrimeEvents();
    } catch (err) {
      console.error('Failed to simulate crime event', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard glow="red" className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold font-mono text-slate-100">
                  HEIWA PROJECT: 17-KEYPOINT SKELETAL POSE CRIME & VIOLENCE INTELLIGENCE (F-04)
                </h2>
                <StatusPill status="online" label="SKELETAL GRAPH ACTIVE" />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Spatio-Temporal Graph CNN • Physical Assault • Weapon Draw • Molestation / Struggle • Group Brawls • Automated PCR Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={loadCrimeEvents}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            REFRESH SENSORS
          </button>
        </div>

        {/* 4 Metric Panels */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500">HEIWA DETECTIONS</span>
            <p className="text-xl font-extrabold text-rose-400">{crimeEvents.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Violent incidents stopped</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500">POLICE PATROLS DISPATCHED</span>
            <p className="text-xl font-extrabold text-cyan-400">
              {crimeEvents.filter((c) => c.police_sos_dispatched).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Nearest PCR vans on-scene</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500">KEYPOINT TOPOLOGY</span>
            <p className="text-xl font-extrabold text-emerald-400">17 Nodes</p>
            <p className="text-[10px] text-slate-400 mt-0.5">COCO Human Pose Schema</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500">INFERENCE SPEED</span>
            <p className="text-xl font-extrabold text-amber-400">18.5 ms</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time edge camera stream</p>
          </div>
        </div>
      </GlassCard>

      {/* Simulator & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulation Testbed */}
        <GlassCard glow="cyan" className="p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">HEIWA SCENARIO INJECTOR</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/40">
              PYTORCH GRAPH
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">VIOLENT ACTION TO SIMULATE</label>
              <select
                value={simAction}
                onChange={(e) => setSimAction(e.target.value)}
                className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="PHYSICAL_ASSAULT_SLAP">Physical Assault / Slap / Kinetic Strike</option>
                <option value="WEAPON_KNIFE_DRAW">Weapon Knife Draw / Sharp Object Thrust</option>
                <option value="MOLESTATION_STRUGGLE">Molestation / Unlawful Restraint / Struggle</option>
                <option value="GROUP_BRAWL_FIGHT">Group Brawl / Multi-Person Chaotic Fight</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">SURVEILLANCE CAMERA</label>
              <select
                value={simCamera}
                onChange={(e) => setSimCamera(e.target.value)}
                className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="cam-02">cam-02 (Barakhamba Junction)</option>
                <option value="cam-01">cam-01 (Connaught Place Outer Ring)</option>
                <option value="cam-03">cam-03 (Janpath Crossroad)</option>
                <option value="cam-04">cam-04 (Mandi House Circle)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">INVOLVED PERSON COUNT: {simPersons}</label>
              <input
                type="range"
                min="1"
                max="6"
                value={simPersons}
                onChange={(e) => setSimPersons(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800"
              />
            </div>

            {/* 17-Keypoint Interactive Topological Skeleton Preview */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 block">17-NODE TOPOLOGICAL SKELETON SCHEMA</span>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-300">
                {KEYPOINT_NAMES.map((name, idx) => (
                  <div key={idx} className="p-1 rounded bg-[#06101c] border border-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                    <span className="truncate">{idx}: {name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulateCrime}
              disabled={simulating}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              {simulating ? 'EVALUATING SKELETAL MOTION...' : 'SIMULATE CRIME & DISPATCH PATROL'}
            </button>
          </div>
        </GlassCard>

        {/* Center & Right Column: Live Violent Event Feed & Police SOS Dispatch */}
        <div className="lg:col-span-2 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              DETECTED VIOLENT INCIDENTS & POLICE SOS STREAM
            </h3>
            <span className="text-xs text-slate-400">{crimeEvents.length} recorded events</span>
          </div>

          {crimeEvents.length === 0 ? (
            <GlassCard className="p-8 text-center text-slate-400 text-xs">
              No human violence detected. Use the simulator on the left to inject 17-keypoint violent pose sequences.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {crimeEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedEvent?.id === evt.id
                      ? 'bg-[#121c2e] border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-[#081220]/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                        {evt.action_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-100">{evt.zone_name}</span>
                      <span className="text-[11px] text-slate-400">({evt.camera_id})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                    {evt.explanation}
                  </p>

                  {/* Police SOS Patrol Dispatch Card */}
                  {evt.police_sos_dispatched && (
                    <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                          <Shield className="w-4 h-4" />
                          <span>POLICE EMERGENCY SOS PATROL DISPATCHED</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                          CONFIDENCE: {(evt.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block">ASSIGNED PATROL UNIT:</span>
                          <span className="font-semibold text-cyan-300">{evt.dispatched_patrol_unit}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">JURISDICTION STATION:</span>
                          <span className="font-semibold text-amber-300">{evt.nearest_police_station}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

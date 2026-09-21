import React, { useState, useEffect } from 'react';
import {
  AlertOctagon, Ambulance, ShieldAlert, Volume2, Activity,
  Radio, Play, Zap, CheckCircle2, Hospital, Compass, ArrowRight,
  TrendingUp, AlertTriangle, RefreshCw
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';
import { AccidentIncident, SOSDispatch } from '../../types';
import { api } from '../../services/api';

export const AccidentSOSPanel: React.FC = () => {
  const [incidents, setIncidents] = useState<AccidentIncident[]>([]);
  const [dispatches, setDispatches] = useState<SOSDispatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<AccidentIncident | null>(null);

  // Simulation Form State
  const [simTrigger, setSimTrigger] = useState<string>('SPATIAL_COLLISION_OVERLAP');
  const [simCamera, setSimCamera] = useState<string>('cam-01');
  const [simPlateA, setSimPlateA] = useState<string>('DL01AB1234');
  const [simPlateB, setSimPlateB] = useState<string>('MH02CD5678');
  const [simDbLevel, setSimDbLevel] = useState<number>(104.5);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incList, dispList] = await Promise.all([
        api.getAccidentIncidents(),
        api.getSOSDispatches()
      ]);
      setIncidents(incList);
      setDispatches(dispList);
      if (incList.length > 0 && !selectedIncident) {
        setSelectedIncident(incList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch accident data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateCrash = async () => {
    setSimulating(true);
    try {
      await api.simulateCrash({
        camera_id: simCamera,
        trigger_type: simTrigger,
        primary_plate: simPlateA,
        secondary_plate: simPlateB,
        acoustic_db_level: simDbLevel,
        lateral_accel_ms2: 6.8
      });
      await loadData();
    } catch (err) {
      console.error('Failed to simulate crash', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard glow="cyan" className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold font-mono text-slate-100">
                  MULTI-MODAL ACCIDENT & COLLISION INTELLIGENCE (F-02 & F-03)
                </h2>
                <StatusPill status="online" label="ACTIVE SOS DISPATCH" />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Spatial IoU Overlap • Lateral Acceleration Deviation • Acoustic PyTorch Mel-Spectrogram CNN • ResQRoute Emergency Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            REFRESH FEEDS
          </button>
        </div>

        {/* Live Metrics Quick Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">TOTAL ACCIDENTS PREDICTED</span>
            <p className="text-xl font-mono font-extrabold text-rose-400">{incidents.length}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Spatial & Acoustic fusion</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">ACTIVE SOS DISPATCHES</span>
            <p className="text-xl font-mono font-extrabold text-emerald-400">{dispatches.length}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Trauma Care & PCR Vans</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">AVG AMBULANCE ETA</span>
            <p className="text-xl font-mono font-extrabold text-cyan-400">4.2 min</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">With Dynamic Green Waves</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono">ACOUSTIC SENSITIVITY</span>
            <p className="text-xl font-mono font-extrabold text-amber-400">96.4 dB</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tire Skid & Metal Crush CNN</p>
          </div>
        </div>
      </GlassCard>

      {/* Simulator & Live Incident Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Simulation Trigger */}
        <GlassCard glow="amber" className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold font-mono text-slate-200">ACCIDENT SIMULATION TESTBED</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
              PYTORCH ENGINE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">DETECTION TRIGGER TYPE</label>
              <select
                value={simTrigger}
                onChange={(e) => setSimTrigger(e.target.value)}
                className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="SPATIAL_COLLISION_OVERLAP">Visual Spatial Bounding Box Overlap</option>
                <option value="ABRUPT_LANE_DEVIATION">High-Speed Abrupt Lateral Deviation (a_lat &gt; 4.5 m/s²)</option>
                <option value="ACOUSTIC_METAL_CRUSH">Acoustic Signature: Metal Crush / Impact CNN</option>
                <option value="ACOUSTIC_TIRE_SKID">Acoustic Signature: Severe Tire Skid Sound</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">MONITORED CAMERA NODE</label>
              <select
                value={simCamera}
                onChange={(e) => setSimCamera(e.target.value)}
                className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="cam-01">cam-01 (Connaught Place Outer Ring)</option>
                <option value="cam-02">cam-02 (Barakhamba Junction)</option>
                <option value="cam-03">cam-03 (Janpath Crossroad)</option>
                <option value="cam-04">cam-04 (Mandi House Circle)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">PRIMARY VEHICLE</label>
                <input
                  type="text"
                  value={simPlateA}
                  onChange={(e) => setSimPlateA(e.target.value)}
                  className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SECONDARY VEHICLE</label>
                <input
                  type="text"
                  value={simPlateB}
                  onChange={(e) => setSimPlateB(e.target.value)}
                  className="w-full bg-[#071322] border border-slate-700 rounded-lg p-2 text-slate-200 uppercase"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-400">ACOUSTIC DECIBEL LEVEL: {simDbLevel} dB</label>
                <span className="text-[10px] text-rose-400">{simDbLevel > 95 ? 'CRITICAL THRESHOLD' : 'NORMAL'}</span>
              </div>
              <input
                type="range"
                min="60"
                max="120"
                step="0.5"
                value={simDbLevel}
                onChange={(e) => setSimDbLevel(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800"
              />
            </div>

            <button
              onClick={handleSimulateCrash}
              disabled={simulating}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              {simulating ? 'EVALUATING SENSORS & DISPATCHING...' : 'TRIGGER CRASH & SOS DISPATCH'}
            </button>
          </div>
        </GlassCard>

        {/* Center & Right Columns: Incident Feed & Linked Emergency SOS Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              DETECTED ACCIDENT INCIDENTS & DISPATCH STREAM
            </h3>
            <span className="text-xs font-mono text-slate-400">{incidents.length} recorded events</span>
          </div>

          {incidents.length === 0 ? (
            <GlassCard className="p-8 text-center text-slate-400 font-mono text-xs">
              No accident incidents detected. Use the simulation panel on the left to test spatial collision or acoustic triggers.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedIncident?.id === inc.id
                      ? 'bg-[#0d1d33] border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-[#081220]/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                        {inc.trigger_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-100">{inc.road_segment_name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({inc.camera_id})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(inc.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Telemetry Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono mb-3">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[9px] text-slate-500 block">PRIMARY PLATE</span>
                      <span className="text-cyan-300 font-bold">{inc.primary_vehicle_plate || 'UNKNOWN'}</span>
                    </div>
                    {inc.secondary_vehicle_plate && (
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block">SECONDARY PLATE</span>
                        <span className="text-cyan-300 font-bold">{inc.secondary_vehicle_plate}</span>
                      </div>
                    )}
                    {inc.lateral_accel_ms2 && (
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block">LATERAL ACCEL</span>
                        <span className="text-amber-400 font-bold">{inc.lateral_accel_ms2} m/s²</span>
                      </div>
                    )}
                    {inc.acoustic_db_level && (
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block">ACOUSTIC LEVEL</span>
                        <span className="text-rose-400 font-bold">{inc.acoustic_db_level} dB</span>
                      </div>
                    )}
                  </div>

                  {/* Automated ResQRoute Emergency Dispatch Card */}
                  {inc.sos_dispatch ? (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Ambulance className="w-4 h-4" />
                          <span>AUTOMATED RESQROUTE SOS DISPATCH</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          ETA: {inc.sos_dispatch.eta_minutes} MINS
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
                        <div>
                          <span className="text-slate-500 block">TRAUMA HOSPITAL:</span>
                          <span className="font-semibold text-emerald-300">{inc.sos_dispatch.hospital_name}</span>
                          <span className="text-slate-400"> ({inc.sos_dispatch.hospital_dist_km} km)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">AMBULANCE UNIT:</span>
                          <span className="font-semibold text-cyan-300">{inc.sos_dispatch.ambulance_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">PCR PATROL ESCORT:</span>
                          <span className="font-semibold text-amber-300">{inc.sos_dispatch.pcr_van_id}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Evaluating emergency corridor assignment...
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

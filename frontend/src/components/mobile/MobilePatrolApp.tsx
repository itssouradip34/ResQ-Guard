import React, { useState } from 'react';
import {
  Shield, Camera as CameraIcon, AlertTriangle, Search, Activity,
  Ambulance, CheckCircle2, Video, Eye, Send, Sparkles, Navigation
} from 'lucide-react';
import { Camera, Alert, Vehicle, ResQRouteScenario } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

interface MobilePatrolAppProps {
  cameras: Camera[];
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string) => void;
  resqScenario: ResQRouteScenario | null;
}

export const MobilePatrolApp: React.FC<MobilePatrolAppProps> = ({
  cameras,
  alerts,
  onAcknowledgeAlert,
  resqScenario
}) => {
  const [mobileTab, setMobileTab] = useState<'scan' | 'alerts' | 'cameras' | 'corridor'>('scan');
  
  // Quick OCR Scanner state
  const [scanPlateInput, setScanPlateInput] = useState('DL01AB1234');
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleQuickScan = async () => {
    if (!scanPlateInput) return;
    setIsScanning(true);
    try {
      // Query vehicle and similar targets
      const vehicles = await api.getVehicles();
      const match = vehicles.find((v) => v.plate_number.toUpperCase().includes(scanPlateInput.toUpperCase()));
      if (match) {
        const traj = await api.getTrajectory(match.id).catch(() => null);
        setScannedResult({ vehicle: match, trajectory: traj });
      } else {
        setScannedResult({
          vehicle: {
            plate_number: scanPlateInput.toUpperCase(),
            vehicle_type: 'car',
            color: 'Unknown',
            is_blacklisted: false,
            last_seen: new Date().toISOString()
          },
          trajectory: null
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-130px)] flex flex-col justify-between bg-[#040912] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl p-4 space-y-4">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold font-mono text-cyan-300">PATROL FIELD OFFICER</h3>
            <p className="text-[10px] font-mono text-slate-400">UNIT #402 • CENTRAL SECTOR</p>
          </div>
        </div>
        <StatusPill status="online" label="ACTIVE DISPATCH" />
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Tab 1: Quick Plate Scanner */}
        {mobileTab === 'scan' && (
          <div className="space-y-4">
            <GlassCard glow="cyan" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                  <CameraIcon className="w-4 h-4 text-cyan-400" />
                  FIELD OCR PLATE SCANNER
                </span>
                <span className="text-[10px] font-mono text-slate-400">Dual AI Engine</span>
              </div>

              {/* Viewfinder simulation */}
              <div className="relative h-36 rounded-xl bg-black border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center p-4">
                <div className="w-44 h-12 border-2 border-cyan-400 rounded flex items-center justify-center bg-cyan-950/30 shadow-[0_0_15px_rgba(0,229,255,0.3)] animate-pulse">
                  <span className="font-mono font-extrabold text-cyan-300 tracking-wider text-sm">
                    {scanPlateInput || 'SCANNING...'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-2">
                  Align license plate within crosshairs
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanPlateInput}
                  onChange={(e) => setScanPlateInput(e.target.value)}
                  placeholder="Enter or scan license plate..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none uppercase"
                />
                <button
                  onClick={handleQuickScan}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  SCAN
                </button>
              </div>
            </GlassCard>

            {/* Scanned Sighting Card */}
            {scannedResult && (
              <GlassCard
                glow={scannedResult.vehicle.is_blacklisted ? 'red' : 'green'}
                className="p-4 space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-sm font-extrabold text-cyan-300">
                    {scannedResult.vehicle.plate_number}
                  </span>
                  {scannedResult.vehicle.is_blacklisted ? (
                    <StatusPill status="critical" label="HOTLIST TARGET" />
                  ) : (
                    <StatusPill status="online" label="CLEAN RECORD" />
                  )}
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <p>Type: <span className="text-slate-100 uppercase">{scannedResult.vehicle.vehicle_type} ({scannedResult.vehicle.color})</span></p>
                  {scannedResult.vehicle.blacklist_reason && (
                    <p className="text-rose-400 font-bold">Alert: {scannedResult.vehicle.blacklist_reason}</p>
                  )}
                  {scannedResult.trajectory && (
                    <p className="text-cyan-300">
                      Recent Sightings: {scannedResult.trajectory.camera_sequence.length} camera checkpoints
                    </p>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Tab 2: Field Alerts */}
        {mobileTab === 'alerts' && (
          <div className="space-y-3">
            <span className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              LIVE FIELD ALERTS ({alerts.length})
            </span>

            {alerts.map((alt) => (
              <GlassCard
                key={alt.id}
                glow={alt.severity === 'critical' ? 'red' : 'amber'}
                className="p-3.5 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-300">{alt.plate_text}</span>
                  <StatusPill status={alt.severity} />
                </div>
                <p className="text-[11px] text-slate-300">{alt.message}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                  {!alt.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alt.id)}
                      className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                    >
                      ACKNOWLEDGE
                    </button>
                  ) : (
                    <span className="text-emerald-400 text-[10px] font-bold">ACKNOWLEDGED</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tab 3: Nearby Cameras */}
        {mobileTab === 'cameras' && (
          <div className="space-y-3">
            <span className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-cyan-400" />
              SECTOR CAMERA CHECK ({cameras.length})
            </span>

            {cameras.map((c) => (
              <GlassCard key={c.id} className="p-3 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{c.name}</span>
                  <StatusPill status={c.status} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Zone: {c.zone}</span>
                  <span className="text-emerald-400 font-bold">{c.fps} FPS</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tab 4: ResQRoute Corridor */}
        {mobileTab === 'corridor' && resqScenario && (
          <div className="space-y-3 font-mono text-xs">
            <GlassCard glow="green" className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Ambulance className="w-4 h-4 text-emerald-400" />
                  GREEN CORRIDOR ACTIVE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  -{resqScenario.optimized_resq_corridor.time_saved_pct}% FASTER
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Origin: {resqScenario.origin.name} → Destination: {resqScenario.destination.name}
              </p>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <p>Ambulance Plate: <span className="text-cyan-300 font-bold">{resqScenario.vehicle_plate}</span></p>
                <p>Transit ETA: <span className="text-emerald-400 font-bold">{resqScenario.optimized_resq_corridor.estimated_time_min} mins</span> (Saved: -{resqScenario.optimized_resq_corridor.time_saved_min} mins)</p>
                <p>Signals Locked Green: <span className="text-emerald-300 font-bold">{resqScenario.optimized_resq_corridor.signals_cleared_green} signals</span></p>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono">
        <button
          onClick={() => setMobileTab('scan')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 ${
            mobileTab === 'scan' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>SCAN</span>
        </button>

        <button
          onClick={() => setMobileTab('alerts')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 ${
            mobileTab === 'alerts' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>ALERTS</span>
        </button>

        <button
          onClick={() => setMobileTab('cameras')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 ${
            mobileTab === 'cameras' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>CAMS</span>
        </button>

        <button
          onClick={() => setMobileTab('corridor')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 ${
            mobileTab === 'corridor' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
          }`}
        >
          <Ambulance className="w-4 h-4" />
          <span>RESQ</span>
        </button>
      </div>
    </div>
  );
};

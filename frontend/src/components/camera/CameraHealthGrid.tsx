import React, { useState } from 'react';
import { Video, Activity, AlertCircle, Power, RefreshCw, CheckCircle2, Radio } from 'lucide-react';
import { Camera } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

interface CameraHealthGridProps {
  cameras: Camera[];
  onRefresh: () => void;
}

export const CameraHealthGrid: React.FC<CameraHealthGridProps> = ({ cameras, onRefresh }) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSimulateOutage = async (cam: Camera) => {
    try {
      setTogglingId(cam.id);
      const nextStatus = cam.status === 'online' ? 'offline' : 'online';
      const nextFps = nextStatus === 'online' ? 25.0 : 0.0;
      await api.sendHeartbeat(cam.id, nextFps, nextStatus);
      onRefresh();
    } catch (e) {
      console.error('Failed to toggle camera outage', e);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081322] p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            MUNICIPAL CAMERA SURVEILLANCE MATRIX & HEALTH (F-10)
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Real-time FPS telemetry, heartbeat monitors, and automated failover detection
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          REFRESH NODES
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameras.map((cam) => (
          <GlassCard
            key={cam.id}
            glow={cam.status === 'online' ? 'cyan' : cam.status === 'degraded' ? 'amber' : 'red'}
            className="p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  cam.status === 'online' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-slate-100">{cam.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">ID: {cam.id}</span>
                </div>
              </div>
              <StatusPill status={cam.status} />
            </div>

            {/* Video Feed Simulation Thumbnail */}
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 h-32 flex items-center justify-center">
              {cam.status === 'online' ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10"></div>
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    LIVE RTSP FEED
                  </div>
                  <div className="absolute bottom-2 left-2 z-20 text-[10px] font-mono text-slate-300">
                    {cam.road_segment || cam.zone}
                  </div>
                  <div className="absolute bottom-2 right-2 z-20 text-[10px] font-mono text-emerald-400 font-bold">
                    {cam.fps} FPS
                  </div>
                  <div className="text-slate-600 font-mono text-xs">
                    [ STREAM ACTIVE - BUFFER READY ]
                  </div>
                </>
              ) : (
                <div className="text-center font-mono space-y-1">
                  <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-400 font-bold">CAMERA OFFLINE</p>
                  <p className="text-[10px] text-slate-500">Heartbeat Timed Out (&gt;30s)</p>
                </div>
              )}
            </div>

            {/* Telemetry info */}
            <div className="space-y-1 font-mono text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between">
                <span>ZONE:</span>
                <span className="text-slate-200">{cam.zone}</span>
              </div>
              <div className="flex justify-between">
                <span>COORDINATES:</span>
                <span className="text-slate-200">{cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>LAST HEARTBEAT:</span>
                <span className="text-cyan-300">
                  {cam.last_heartbeat ? new Date(cam.last_heartbeat).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>

            {/* Stage Demo Outage Simulator Button */}
            <button
              onClick={() => handleSimulateOutage(cam)}
              disabled={togglingId === cam.id}
              className={`w-full py-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                cam.status === 'online'
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {cam.status === 'online' ? 'SIMULATE OUTAGE (KILL CAMERA)' : 'RESTORE CAMERA ONLINE'}
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

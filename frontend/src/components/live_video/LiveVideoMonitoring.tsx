import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Shield, AlertTriangle, Radio, Play, Pause, RotateCcw,
  Zap, Ambulance, Car, Gauge, Eye, CheckCircle2, ChevronRight,
  Flame, Bell, Activity, Sparkles, Cpu, Clock, Volume2, VolumeX
} from 'lucide-react';
import { Camera, VehicleEvent, Alert } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

interface LiveVideoMonitoringProps {
  cameras: Camera[];
  onTriggerAlert?: (alert: Partial<Alert>) => void;
  onSelectVehicleForTracking?: (plate: string) => void;
}

interface LaneDetection {
  id: string;
  vehicleType: string;
  color: string;
  plate: string;
  confidence: number;
  speed: number;
  box: { top: number; left: number; width: number; height: number };
  isBlacklisted?: boolean;
  isEmergency?: boolean;
}

interface SimulatedLane {
  id: string;
  name: string;
  direction: 'North' | 'South' | 'East' | 'West';
  cameraId: string;
  videoSrc: string;
  signal: 'green' | 'yellow' | 'red';
  countdown: number;
  vehicleCount: number;
  density: number; // 0 - 100%
  detections: LaneDetection[];
}

export const LiveVideoMonitoring: React.FC<LiveVideoMonitoringProps> = ({
  cameras,
  onTriggerAlert,
  onSelectVehicleForTracking
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeGreenLane, setActiveGreenLane] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(18);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [emergencyLaneId, setEmergencyLaneId] = useState<string | null>(null);
  const [sosAlertActive, setSosAlertActive] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [selectedCameraForFocus, setSelectedCameraForFocus] = useState<string | null>(null);

  // Define 4 Primary Surveillance Lanes mapped to real video files
  const [lanes, setLanes] = useState<SimulatedLane[]>([
    {
      id: 'lane-1',
      name: 'North Lane - Connaught Place Radial',
      direction: 'North',
      cameraId: 'cam-01',
      videoSrc: '/static/videos/cam_01_connaught.mp4',
      signal: 'green',
      countdown: 18,
      vehicleCount: 16,
      density: 74,
      detections: [
        { id: 'd1', vehicleType: 'car', color: 'White', plate: 'DL01AB1234', confidence: 0.97, speed: 48, box: { top: 48, left: 32, width: 22, height: 28 }, isBlacklisted: true },
        { id: 'd2', vehicleType: 'suv', color: 'Black', plate: 'HR26DQ5551', confidence: 0.94, speed: 52, box: { top: 38, left: 62, width: 18, height: 24 } }
      ]
    },
    {
      id: 'lane-2',
      name: 'South Lane - India Gate Roundabout',
      direction: 'South',
      cameraId: 'cam-02',
      videoSrc: '/static/videos/cam_02_indiagate.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 11,
      density: 52,
      detections: [
        { id: 'd3', vehicleType: 'car', color: 'Silver', plate: 'DL08CX9920', confidence: 0.95, speed: 44, box: { top: 50, left: 24, width: 20, height: 26 } },
        { id: 'd4', vehicleType: 'motorbike', color: 'Red', plate: 'DL04XY4021', confidence: 0.91, speed: 38, box: { top: 62, left: 54, width: 14, height: 20 } }
      ]
    },
    {
      id: 'lane-3',
      name: 'East Lane - Ring Road Flyover',
      direction: 'East',
      cameraId: 'cam-03',
      videoSrc: '/static/videos/cam_03_ringroad.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 22,
      density: 88,
      detections: [
        { id: 'd5', vehicleType: 'truck', color: 'Yellow', plate: 'UP16CD8821', confidence: 0.92, speed: 36, box: { top: 44, left: 40, width: 24, height: 32 } },
        { id: 'd6', vehicleType: 'car', color: 'Blue', plate: 'DL03MN7812', confidence: 0.96, speed: 58, box: { top: 56, left: 18, width: 19, height: 25 } }
      ]
    },
    {
      id: 'lane-4',
      name: 'West Lane - AIIMS Emergency Corridor',
      direction: 'West',
      cameraId: 'cam-04',
      videoSrc: '/static/videos/cam_04_aiims.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 8,
      density: 38,
      detections: [
        { id: 'd7', vehicleType: 'ambulance', color: 'White/Red', plate: 'MH02CD5678', confidence: 0.98, speed: 64, box: { top: 46, left: 36, width: 26, height: 34 }, isEmergency: true }
      ]
    }
  ]);

  // Dynamic Signal Cycle Timer (Adaptive Webster Traffic Logic)
  useEffect(() => {
    if (!isPlaying || emergencyActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Switch to next lane in round-robin cycle
          setActiveGreenLane((currLane) => {
            const nextLane = (currLane + 1) % lanes.length;
            // Adaptive Green Split based on lane vehicle density
            const nextGreenSeconds = Math.max(12, Math.round((lanes[nextLane].density / 100) * 25));
            setCountdown(nextGreenSeconds);
            return nextLane;
          });
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, emergencyActive, lanes]);

  // Update signals whenever activeGreenLane changes (Ensuring Lanezy Core Rule: Only 1 green signal at a time)
  useEffect(() => {
    if (emergencyActive) return;

    setLanes((prevLanes) =>
      prevLanes.map((lane, idx) => ({
        ...lane,
        signal: idx === activeGreenLane ? (countdown <= 3 ? 'yellow' : 'green') : 'red',
        countdown: idx === activeGreenLane ? countdown : 0
      }))
    );
  }, [activeGreenLane, countdown, emergencyActive]);

  // Handle Emergency Vehicle Override (Lanezy Hallmark)
  const handleEmergencyOverride = (laneId: string) => {
    setEmergencyActive(true);
    setEmergencyLaneId(laneId);
    setCountdown(30);

    setLanes((prevLanes) =>
      prevLanes.map((l) => ({
        ...l,
        signal: l.id === laneId ? 'green' : 'red',
        countdown: l.id === laneId ? 30 : 0
      }))
    );

    if (onTriggerAlert) {
      onTriggerAlert({
        alert_type: 'emergency_preemption',
        severity: 'critical',
        message: `EMERGENCY GREEN CORRIDOR LOCKED: Rapid preemption on ${laneId}. Signal locked to GREEN. Conflicting lanes held on RED.`
      });
    }
  };

  // Dismiss Emergency Override
  const handleDismissEmergency = () => {
    setEmergencyActive(false);
    setEmergencyLaneId(null);
    setCountdown(15);
  };

  // Trigger SOS Alert
  const handleTriggerSOS = () => {
    setSosAlertActive(true);
    if (onTriggerAlert) {
      onTriggerAlert({
        alert_type: 'sos_police_dispatch',
        severity: 'critical',
        message: 'EMERGENCY SOS ALERT — Immediate municipal police & trauma assistance dispatched to intersection.'
      });
    }
    setTimeout(() => setSosAlertActive(false), 8000);
  };

  // Video Element references for control
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        if (isPlaying) video.pause();
        else video.play().catch(() => {});
      }
    });
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) video.playbackRate = speed;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Lanezy Live Control Header */}
      <div className="bg-gradient-to-r from-[#071324] via-[#091b33] to-[#071324] border border-cyan-500/30 p-4 lg:p-6 rounded-2xl shadow-[0_0_35px_rgba(0,229,255,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-mono font-extrabold text-white tracking-wider flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              LIVE LANE MONITORING & ANPR SURVEILLANCE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
              MULTI-LANE SYNCHRONOUS FEED
            </span>
          </div>
          <p className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-2">
            <span>Adaptive Signal Controller</span>
            <span className="text-slate-600">•</span>
            <span>Real-Time YOLOv8 Bounding Boxes</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">Dual-OCR Engine Fusion Enabled</span>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Play / Pause */}
          <button
            onClick={togglePlayPause}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              isPlaying
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-cyan-400" />}
            <span>{isPlaying ? 'PAUSE FEEDS' : 'RESUME FEEDS'}</span>
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs font-mono">
            {[1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => handlePlaybackSpeedChange(s)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  playbackRate === s
                    ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(0,229,255,0.5)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Emergency SOS Button (Lanezy Feature) */}
          <button
            onClick={handleTriggerSOS}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-xs font-mono font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>EMERGENCY SOS ALERT</span>
          </button>
        </div>
      </div>

      {/* Emergency Active Banner */}
      {emergencyActive && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)] flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <Ambulance className="w-7 h-7 text-rose-400 animate-pulse" />
            <div>
              <h4 className="font-mono font-extrabold text-sm text-white">
                🚨 EMERGENCY VEHICLE APPROACHING — PREEMPTION ACTIVE 🚨
              </h4>
              <p className="font-mono text-xs text-rose-200">
                Green wave corridor locked on <span className="font-bold text-white underline">{emergencyLaneId?.toUpperCase()}</span>. All conflicting signals held on RED. Police and dispatch notified.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissEmergency}
            className="px-4 py-2 rounded-xl bg-white text-rose-950 hover:bg-rose-100 font-mono font-bold text-xs shadow-lg transition-all"
          >
            RESET TO AUTOMATIC ADAPTIVE CYCLE
          </button>
        </div>
      )}

      {/* SOS Alert Broadcast Toast */}
      {sosAlertActive && (
        <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-3">
          <Bell className="w-6 h-6 text-amber-400 animate-spin" />
          <div className="font-mono text-xs text-amber-200">
            <span className="font-extrabold text-amber-300">POLICE NOTIFIED:</span> Immediate police patrol dispatch unit alerted with GPS coordinates. CCTV node records archived for evidence.
          </div>
        </div>
      )}

      {/* Active Signal Logic Summary Card (Lanezy Core Rule) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Current Green Lane</span>
            <h4 className="text-sm font-mono font-bold text-emerald-300">
              {lanes[activeGreenLane]?.name.split(' - ')[0] || 'Lane 1'}
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">
              {countdown}s remaining
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Intersection Density</span>
            <h4 className="text-sm font-mono font-bold text-slate-200">
              {lanes.reduce((acc, l) => acc + l.vehicleCount, 0)} Vehicles Monitored
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">
              Avg Speed: 46.5 km/h
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Core Traffic Rule</span>
            <h4 className="text-sm font-mono font-bold text-amber-300">
              Only 1 Green Signal at a time
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Prevents intersection collisions
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Optimization Logic</span>
            <h4 className="text-sm font-mono font-bold text-purple-300">
              Webster Adaptive Split
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Allocates green time by density
            </span>
          </div>
        </GlassCard>
      </div>

      {/* 4-Lane / Multi-Camera Video Surveillance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lanes.map((lane, index) => {
          const isGreen = lane.signal === 'green';
          const isYellow = lane.signal === 'yellow';
          const isRed = lane.signal === 'red';

          return (
            <GlassCard
              key={lane.id}
              glow={isGreen ? 'green' : isYellow ? 'amber' : 'red'}
              className="p-5 space-y-4 relative overflow-hidden transition-all"
            >
              {/* Lane Header with Traffic Signal Indicator */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-white">
                      {lane.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                      ID: {lane.cameraId}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Direction: <span className="text-cyan-400 font-bold">{lane.direction}</span> • Density: {lane.density}% ({lane.vehicleCount} veh)
                  </p>
                </div>

                {/* Tactical 3-Light Traffic Signal Display */}
                <div className="flex items-center gap-2 bg-[#040914] px-3 py-1.5 rounded-xl border border-slate-800">
                  {/* Red Light */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isRed
                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] scale-110 animate-pulse'
                        : 'bg-rose-950 opacity-40'
                    }`}
                  />
                  {/* Yellow Light */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isYellow
                        ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-110 animate-pulse'
                        : 'bg-amber-950 opacity-40'
                    }`}
                  />
                  {/* Green Light */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      isGreen
                        ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)] scale-110 animate-pulse'
                        : 'bg-emerald-950 opacity-40'
                    }`}
                  />
                  {/* Countdown Badge */}
                  <span
                    className={`ml-1.5 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      isGreen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isGreen ? `${lane.countdown}s` : 'WAIT'}
                  </span>
                </div>
              </div>

              {/* Video Player Container with AI Bounding Box Overlays */}
              <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center group">
                <video
                  ref={(el) => {
                    videoRefs.current[lane.id] = el;
                  }}
                  src={lane.videoSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Live Tactical HUD Overlay */}
                <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    LIVE 1080p
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-[10px] font-mono text-emerald-400 font-bold backdrop-blur-md">
                    25.0 FPS
                  </span>
                </div>

                <div className="absolute top-2 right-2 z-20">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border backdrop-blur-md ${
                      isGreen
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                        : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                    }`}
                  >
                    {isGreen ? 'SIGNAL: PROCEED (GREEN)' : 'SIGNAL: STOP (RED)'}
                  </span>
                </div>

                {/* Real-Time Bounding Boxes and Floating Plate Tags */}
                {lane.detections.map((det) => (
                  <div
                    key={det.id}
                    style={{
                      top: `${det.box.top}%`,
                      left: `${det.box.left}%`,
                      width: `${det.box.width}%`,
                      height: `${det.box.height}%`
                    }}
                    className={`absolute z-10 border-2 rounded pointer-events-none transition-all ${
                      det.isEmergency
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                        : det.isBlacklisted
                        ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)]'
                        : 'border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    }`}
                  >
                    {/* Floating License Plate Tag */}
                    <div className="absolute -top-7 left-0 pointer-events-auto">
                      <div
                        onClick={() => onSelectVehicleForTracking && onSelectVehicleForTracking(det.plate)}
                        title="Click to reconstruct trajectory"
                        className={`cursor-pointer px-2 py-0.5 rounded font-mono font-extrabold text-[10px] flex items-center gap-1 shadow-lg backdrop-blur-md whitespace-nowrap border ${
                          det.isEmergency
                            ? 'bg-emerald-950/95 text-emerald-200 border-emerald-400'
                            : det.isBlacklisted
                            ? 'bg-rose-950/95 text-rose-200 border-rose-500 animate-pulse'
                            : 'bg-slate-950/90 text-cyan-200 border-cyan-500/50'
                        }`}
                      >
                        {det.isEmergency && <span>🚑</span>}
                        {det.isBlacklisted && <span className="text-rose-400 font-bold">⚠️ WANTED:</span>}
                        <span>{det.plate}</span>
                        <span className="text-[9px] text-slate-400">({Math.round(det.confidence * 100)}%)</span>
                      </div>
                    </div>

                    {/* Speed Tag at bottom of bounding box */}
                    <div className="absolute -bottom-5 right-0">
                      <span className="px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] text-slate-300 border border-slate-700">
                        {det.speed} km/h
                      </span>
                    </div>
                  </div>
                ))}

                {/* Bottom Video HUD Strip */}
                <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between bg-black/75 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                  <span>YOLOv8 ByteTrack: {lane.detections.length} Active Tracks</span>
                  <span className="text-cyan-300">Dual-OCR: Paddle + EasyOCR</span>
                </div>
              </div>

              {/* Lane Actions / Emergency Override Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleEmergencyOverride(lane.id)}
                  className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                    emergencyLaneId === lane.id
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40 hover:border-rose-400'
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                  <span>OVERRIDE FOR EMERGENCY VEHICLE</span>
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

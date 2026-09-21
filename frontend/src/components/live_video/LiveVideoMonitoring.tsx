import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Shield, AlertTriangle, Radio, Play, Pause, RotateCcw,
  Zap, Ambulance, Car, Gauge, Eye, CheckCircle2, ChevronRight,
  Flame, Bell, Activity, Sparkles, Cpu, Clock, Volume2, VolumeX,
  Upload, FileVideo, Layers, Target, Compass
} from 'lucide-react';
import { Camera, Alert } from '../../types';
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
  density: number;
  detections: LaneDetection[];
}

export const LiveVideoMonitoring: React.FC<LiveVideoMonitoringProps> = ({
  cameras,
  onTriggerAlert,
  onSelectVehicleForTracking
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'analyzer'>('matrix');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeGreenLane, setActiveGreenLane] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(18);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [emergencyLaneId, setEmergencyLaneId] = useState<string | null>(null);
  const [sosAlertActive, setSosAlertActive] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // 4 Primary Surveillance Lanes mapped to real video files
  const [lanes, setLanes] = useState<SimulatedLane[]>([
    {
      id: 'lane-1',
      name: 'North Lane - Connaught Place Radial',
      direction: 'North',
      cameraId: 'cam-01',
      videoSrc: '/static/videos/cam_01_connaught.mp4',
      signal: 'green',
      countdown: 18,
      vehicleCount: 0,
      density: 74,
      detections: []
    },
    {
      id: 'lane-2',
      name: 'South Lane - India Gate Roundabout',
      direction: 'South',
      cameraId: 'cam-02',
      videoSrc: '/static/videos/cam_02_indiagate.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 0,
      density: 52,
      detections: []
    },
    {
      id: 'lane-3',
      name: 'East Lane - Ring Road Flyover',
      direction: 'East',
      cameraId: 'cam-03',
      videoSrc: '/static/videos/cam_03_ringroad.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 0,
      density: 88,
      detections: []
    },
    {
      id: 'lane-4',
      name: 'West Lane - AIIMS Emergency Corridor',
      direction: 'West',
      cameraId: 'cam-04',
      videoSrc: '/static/videos/cam_04_aiims.mp4',
      signal: 'red',
      countdown: 0,
      vehicleCount: 0,
      density: 38,
      detections: []
    }
  ]);

  // Custom Video Analyzer State
  const [customVideoSrc, setCustomVideoSrc] = useState<string>('/static/videos/cam_01_connaught.mp4');
  const [customVideoName, setCustomVideoName] = useState<string>('cam_01_connaught.mp4');
  const [customDetections, setCustomDetections] = useState<LaneDetection[]>([]);
  const [customVideoPlaying, setCustomVideoPlaying] = useState<boolean>(true);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);

  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Stable references for background inference loop
  const lanesRef = useRef(lanes);
  lanesRef.current = lanes;
  const webcamActiveRef = useRef(webcamActive);
  webcamActiveRef.current = webcamActive;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Real-time YOLOv8 Computer Vision Inference Loop (1280x720 High-Definition Frame Processing)
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(async () => {
      if (!ctx) return;

      // 1. Process Custom Analyzer Video if active
      if (activeTabRef.current === 'analyzer' && customVideoRef.current) {
        const cVideo = customVideoRef.current;
        if (cVideo.readyState >= 2) {
          try {
            ctx.drawImage(cVideo, 0, 0, 1280, 720);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const res = await fetch('/api/v1/cv/process-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                camera_id: 'custom-analyzer-cam',
                image_base64: dataUrl
              })
            });
            if (res.ok) {
              const data = await res.json();
              setCustomDetections(data.detections || []);
            }
          } catch (e) {
            // ignore network frame skip
          }
        }
      }

      // 2. Process 4-Lane Matrix Feeds
      if (isPlayingRef.current) {
        for (const lane of lanesRef.current) {
          const videoEl = (webcamActiveRef.current && lane.id === 'lane-1')
            ? webcamVideoRef.current
            : videoRefs.current[lane.id];

          if (videoEl && videoEl.readyState >= 2) {
            try {
              ctx.drawImage(videoEl, 0, 0, 1280, 720);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

              const res = await fetch('/api/v1/cv/process-frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  camera_id: lane.cameraId,
                  image_base64: dataUrl
                })
              });

              if (res.ok) {
                const data = await res.json();
                setLanes((prevLanes) =>
                  prevLanes.map((l) =>
                    l.id === lane.id
                      ? {
                          ...l,
                          vehicleCount: data.count || 0,
                          detections: data.detections || []
                        }
                      : l
                  )
                );
              }
            } catch (err) {
              // frame skip
            }
          }
        }
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // Handle Live Webcam Toggle
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        webcamVideoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.play();
        }
        setWebcamActive(true);
      } catch (err) {
        alert("Webcam permission denied or camera unavailable.");
      }
    }
  };

  // Handle Custom Video File Upload for a lane
  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, laneId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLanes((prev) =>
      prev.map((l) => (l.id === laneId ? { ...l, videoSrc: url } : l))
    );
    setTimeout(() => {
      const videoEl = videoRefs.current[laneId];
      if (videoEl) {
        videoEl.load();
        videoEl.play().catch(() => {});
      }
    }, 150);
  };

  // Handle Dedicated Video Analyzer File Upload
  const handleAnalyzerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomVideoSrc(url);
    setCustomVideoName(file.name);
    setCustomDetections([]);
    setTimeout(() => {
      if (customVideoRef.current) {
        customVideoRef.current.load();
        customVideoRef.current.play().catch(() => {});
        setCustomVideoPlaying(true);
      }
    }, 150);
  };

  // Signal cycle countdown timer
  useEffect(() => {
    if (emergencyActive || !isPlaying) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setActiveGreenLane((curr) => (curr + 1) % 4);
          return 18;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emergencyActive, isPlaying]);

  // Update signals whenever activeGreenLane changes
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

  // Handle Emergency Vehicle Override
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

  const togglePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        if (!nextState) video.pause();
        else video.play().catch(() => {});
      }
    });
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) video.playbackRate = speed;
    });
    if (customVideoRef.current) customVideoRef.current.playbackRate = speed;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Live Control Header */}
      <div className="bg-gradient-to-r from-[#071324] via-[#091b33] to-[#071324] border border-cyan-500/30 p-4 lg:p-6 rounded-2xl shadow-[0_0_35px_rgba(0,229,255,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-mono font-extrabold text-white tracking-wider flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              LIVE VISION & MULTI-LANE ANPR SURVEILLANCE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
              YOLOv8 + DUAL-OCR
            </span>
          </div>
          <p className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-2">
            <span>Adaptive Webster Split</span>
            <span className="text-slate-600">•</span>
            <span>Spatial Multi-Object Tracking</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">1080p Real-Time Number Plate & Speed Analytics</span>
          </p>
        </div>

        {/* View Mode Tabs & Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'matrix'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4-LANE MATRIX</span>
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'analyzer'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileVideo className="w-3.5 h-3.5" />
              <span>CUSTOM VIDEO ANALYZER</span>
            </button>
          </div>

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

          {/* Webcam Toggle */}
          <button
            onClick={toggleWebcam}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              webcamActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{webcamActive ? 'STOP WEBCAM' : 'USE LIVE WEBCAM'}</span>
          </button>

          {/* Toggle Bounding Box Overlays */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              showOverlays
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{showOverlays ? 'AI BOXES: ON' : 'AI BOXES: OFF'}</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Emergency SOS Button */}
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

      {/* TAB 1: 4-LANE MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Active Signal Logic Summary Cards */}
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
                <span className="text-[10px] font-mono text-slate-400 uppercase">Monitored Vehicles</span>
                <h4 className="text-sm font-mono font-bold text-slate-200">
                  {lanes.reduce((acc, l) => acc + l.vehicleCount, 0)} Active Objects
                </h4>
                <span className="text-[11px] font-mono text-cyan-400">
                  Real-Time Velocity Tracking
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Lanezy Rule</span>
                <h4 className="text-sm font-mono font-bold text-amber-300">
                  Strict 1-Green Concurrency
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Zero intersection deadlock
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center gap-3 border-cyan-800/40">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Spatial Tracker</span>
                <h4 className="text-sm font-mono font-bold text-purple-300">
                  IoU + Centroid Tracking
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Stable ID persistence
                </span>
              </div>
            </GlassCard>
          </div>

          {/* 4-Lane Video Surveillance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lanes.map((lane) => {
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
                    {webcamActive && lane.id === 'lane-1' ? (
                      <video
                        ref={webcamVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
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
                    )}

                    {/* Live Tactical HUD Overlay */}
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
                        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                        {webcamActive && lane.id === 'lane-1' ? 'WEBCAM 1080p' : 'LIVE 1080p'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-[10px] font-mono text-emerald-400 font-bold backdrop-blur-md">
                        25.0 FPS
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                      <label className="cursor-pointer px-2 py-0.5 rounded bg-black/80 border border-slate-700 hover:border-cyan-500 text-[9px] font-mono text-slate-300 hover:text-cyan-300 backdrop-blur-md transition-all">
                        <input
                          type="file"
                          accept="video/*,image/*"
                          className="hidden"
                          onChange={(e) => handleCustomVideoUpload(e, lane.id)}
                        />
                        📂 UPLOAD FEED
                      </label>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border backdrop-blur-md ${
                          isGreen
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                        }`}
                      >
                        {isGreen ? 'PROCEED (GREEN)' : 'STOP (RED)'}
                      </span>
                    </div>

                    {/* Real-Time Bounding Boxes and Floating Plate Tags */}
                    {showOverlays && lane.detections.map((det) => (
                      <div
                        key={det.id}
                        style={{
                          top: `${det.box.top}%`,
                          left: `${det.box.left}%`,
                          width: `${det.box.width}%`,
                          height: `${det.box.height}%`
                        }}
                        className={`absolute z-10 border-2 rounded pointer-events-none transition-all duration-300 ${
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
                            onClick={() => det.plate && onSelectVehicleForTracking && onSelectVehicleForTracking(det.plate)}
                            title={det.plate ? "Click to reconstruct trajectory" : `${det.vehicleType} detected`}
                            className={`cursor-pointer px-2 py-0.5 rounded font-mono font-extrabold text-[10px] flex items-center gap-1 shadow-lg backdrop-blur-md whitespace-nowrap border ${
                              det.isEmergency
                                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-400'
                                : det.isBlacklisted
                                ? 'bg-rose-950/95 text-rose-200 border-rose-500 animate-pulse'
                                : 'bg-slate-950/90 text-cyan-200 border-cyan-500/50'
                            }`}
                          >
                            {det.isEmergency && <span>🚑 EMERGENCY</span>}
                            {det.isBlacklisted && <span className="text-rose-400 font-bold">⚠️ WANTED</span>}
                            <span>
                              {det.vehicleType === 'car' ? '🚗' : det.vehicleType === 'truck' ? '🚛' : det.vehicleType === 'bus' ? '🚌' : det.vehicleType === 'motorbike' ? '🏍️' : det.vehicleType === 'person' ? '🚶' : '🚘'} {det.vehicleType.toUpperCase()}
                            </span>
                            {det.color && <span className="text-slate-300">[{det.color}]</span>}
                            {det.plate && det.plate !== 'SCANNING...' && <span className="text-emerald-300 font-bold">• {det.plate}</span>}
                            <span className="text-[9px] text-slate-400">({Math.round(det.confidence * 100)}%)</span>
                          </div>
                        </div>

                        {/* Speed Tag at bottom of bounding box */}
                        <div className="absolute -bottom-5 right-0">
                          <span className={`px-1.5 py-0.2 rounded bg-black/80 font-mono text-[9px] border ${det.speed === 0 ? 'text-slate-400 border-slate-800' : 'text-emerald-300 border-emerald-500/40'}`}>
                            {det.speed === 0 ? '0 km/h (PARKED)' : `${det.speed} km/h`}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Bottom Video HUD Strip */}
                    <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between bg-black/75 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                      <span>Spatial Tracks: {lane.detections.length} Objects</span>
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
      )}

      {/* TAB 2: DEDICATED CUSTOM VIDEO & AI VISION ANALYZER */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-6 border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
            {/* Header & Upload Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-mono font-extrabold text-base text-white flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-cyan-400" />
                  CUSTOM VIDEO & IMAGE ANPR INTELLIGENCE LAB
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Upload any MP4, AVI, WebM traffic video or snapshot image to run live YOLOv8 multi-class detection, color extraction, and Dual-OCR plate recognition.
                </p>
              </div>

              {/* Upload & Quick Demo Clips */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
                  <Upload className="w-4 h-4" />
                  <span>UPLOAD YOUR VIDEO / IMAGE</span>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    className="hidden"
                    onChange={handleAnalyzerFileUpload}
                  />
                </label>

                {/* Preset test clips */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs font-mono">
                  <span className="text-[10px] text-slate-400 px-2">Presets:</span>
                  <button
                    onClick={() => {
                      setCustomVideoSrc('/static/videos/cam_01_connaught.mp4');
                      setCustomVideoName('cam_01_connaught.mp4');
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    Bus & Crowd
                  </button>
                  <button
                    onClick={() => {
                      setCustomVideoSrc('/static/videos/cam_02_indiagate.mp4');
                      setCustomVideoName('cam_02_indiagate.mp4');
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    Street Traffic
                  </button>
                </div>
              </div>
            </div>

            {/* Video Player & Live Bounding Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-cyan-500/30 aspect-video flex items-center justify-center shadow-2xl">
                  <video
                    ref={customVideoRef}
                    src={customVideoSrc}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-contain"
                  />

                  {/* Top HUD */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/50 text-xs font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
                      <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>{customVideoName}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 font-bold backdrop-blur-md">
                      {customDetections.length} DETECTIONS
                    </span>
                  </div>

                  {/* Real-Time Bounding Boxes */}
                  {customDetections.map((det) => (
                    <div
                      key={det.id}
                      style={{
                        top: `${det.box.top}%`,
                        left: `${det.box.left}%`,
                        width: `${det.box.width}%`,
                        height: `${det.box.height}%`
                      }}
                      className={`absolute z-10 border-2 rounded pointer-events-none transition-all duration-200 ${
                        det.isEmergency
                          ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]'
                          : det.isBlacklisted
                          ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.9)]'
                          : 'border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.5)]'
                      }`}
                    >
                      {/* Floating Plate Tag */}
                      <div className="absolute -top-8 left-0 pointer-events-auto">
                        <div
                          onClick={() => det.plate && onSelectVehicleForTracking && onSelectVehicleForTracking(det.plate)}
                          className={`cursor-pointer px-2.5 py-0.5 rounded-lg font-mono font-extrabold text-[11px] flex items-center gap-1.5 shadow-xl backdrop-blur-md whitespace-nowrap border ${
                            det.isEmergency
                              ? 'bg-emerald-950 text-emerald-200 border-emerald-400'
                              : det.isBlacklisted
                              ? 'bg-rose-950 text-rose-200 border-rose-500 animate-pulse'
                              : 'bg-slate-950/95 text-cyan-200 border-cyan-400'
                          }`}
                        >
                          {det.isEmergency && <span>🚑 EMERGENCY</span>}
                          {det.isBlacklisted && <span className="text-rose-400 font-bold">⚠️ WANTED</span>}
                          <span>
                            {det.vehicleType === 'car' ? '🚗' : det.vehicleType === 'truck' ? '🚛' : det.vehicleType === 'bus' ? '🚌' : det.vehicleType === 'motorbike' ? '🏍️' : det.vehicleType === 'person' ? '🚶' : '🚘'} {det.vehicleType.toUpperCase()}
                          </span>
                          {det.color && <span className="text-slate-300">[{det.color}]</span>}
                          {det.plate && det.plate !== 'SCANNING...' && <span className="text-emerald-300 font-bold">• {det.plate}</span>}
                          <span className="text-[10px] text-slate-400">({Math.round(det.confidence * 100)}%)</span>
                        </div>
                      </div>

                      {/* Speed Tag */}
                      <div className="absolute -bottom-6 right-0">
                        <span className={`px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] border ${det.speed === 0 ? 'text-slate-400 border-slate-700' : 'text-emerald-300 border-emerald-500/40'}`}>
                          {det.speed === 0 ? '0 km/h (PARKED)' : `${det.speed} km/h`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (customVideoRef.current) {
                          if (customVideoPlaying) {
                            customVideoRef.current.pause();
                            setCustomVideoPlaying(false);
                          } else {
                            customVideoRef.current.play();
                            setCustomVideoPlaying(true);
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-1.5"
                    >
                      {customVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{customVideoPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (customVideoRef.current) {
                          customVideoRef.current.currentTime = 0;
                          customVideoRef.current.play();
                          setCustomVideoPlaying(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>REPLAY</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                    <span>Active Video: <span className="text-cyan-300 font-bold">{customVideoName}</span></span>
                    <span>Tracking: <span className="text-emerald-400 font-bold">Enabled</span></span>
                  </div>
                </div>
              </div>

              {/* Detections Intelligence Breakdown Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-xs text-white uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    LIVE NUMBER PLATES & SPEED ({customDetections.length})
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400">REAL-TIME SYNC</span>
                </div>

                {customDetections.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 font-mono text-xs text-slate-500">
                    No objects detected in current frame. Point camera at vehicles or road traffic.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {customDetections.map((d) => (
                      <div
                        key={d.id}
                        className="bg-[#060e1c] p-3.5 rounded-xl border border-cyan-900/40 hover:border-cyan-500/50 transition-all space-y-2.5 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {d.vehicleType === 'car' ? '🚗' : d.vehicleType === 'truck' ? '🚛' : d.vehicleType === 'bus' ? '🚌' : d.vehicleType === 'motorbike' ? '🏍️' : d.vehicleType === 'person' ? '🚶' : '🚘'}
                            </span>
                            <span className="font-mono font-extrabold text-xs text-white uppercase">
                              {d.vehicleType}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-300 border border-slate-700 font-bold">
                              {d.color}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800">
                            {Math.round(d.confidence * 100)}% CONF
                          </span>
                        </div>

                        {/* License Plate Banner */}
                        <div className="flex items-center justify-between text-xs font-mono bg-black/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400">License Plate:</span>
                          <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-extrabold text-xs border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            {d.plate}
                          </span>
                        </div>

                        {/* Velocity Badge */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Velocity:</span>
                          <span className={`font-mono font-bold ${d.speed === 0 ? 'text-slate-400' : 'text-emerald-300'}`}>
                            {d.speed === 0 ? '0.0 km/h (PARKED / SHOULDER)' : `${d.speed} km/h (ACTIVE)`}
                          </span>
                        </div>

                        {d.plate && d.plate !== 'SCANNING...' && onSelectVehicleForTracking && (
                          <button
                            onClick={() => onSelectVehicleForTracking(d.plate)}
                            className="w-full mt-1 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>RECONSTRUCT TRAJECTORY</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

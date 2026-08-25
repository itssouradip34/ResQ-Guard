import React, { useState, useEffect } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  Camera as CameraIcon, Shield, AlertTriangle, Eye, Activity,
  Ambulance, Navigation, Layers, Flame, RefreshCw, Send, CheckCircle2
} from 'lucide-react';
import { Camera, VehicleEvent, Trajectory, ResQRouteScenario, UserRole } from '../../types';
import { api } from '../../services/api';
import { useAuthRole } from '../../context/AuthRoleContext';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

// Custom Leaflet DivIcons for dark tech styling
const createCameraIcon = (status: string) => {
  const color = status === 'online' ? '#00e5ff' : status === 'degraded' ? '#ff9100' : '#ff1744';
  return L.divIcon({
    className: 'custom-camera-marker',
    html: `
      <div style="background: rgba(6, 13, 23, 0.9); border: 2px solid ${color}; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color}80;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
          <circle cx="12" cy="13" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  });
};

const createVehicleIcon = (isBlacklisted: boolean, type: string) => {
  const color = isBlacklisted ? '#ff1744' : type === 'ambulance' ? '#00e676' : '#38bdf8';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="background: rgba(6, 13, 23, 0.95); border: 2px solid ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ${color};">
        <span style="font-size: 14px;">${type === 'ambulance' ? '🚑' : type === 'truck' ? '🚛' : type === 'bus' ? '🚌' : type === 'motorbike' ? '🏍️' : '🚗'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const createAmbulanceIcon = () => {
  return L.divIcon({
    className: 'ambulance-pulse-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(0, 230, 118, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="background: #060d17; border: 2px solid #00e676; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px #00e676; z-index: 10;">
          <span style="font-size: 18px;">🚑</span>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
};

interface LiveMapProps {
  cameras: Camera[];
  recentEvents: VehicleEvent[];
  activeTrajectory: Trajectory | null;
  onSelectVehicle: (vehicleId: string) => void;
  resqScenario: ResQRouteScenario | null;
  isResqActive?: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  cameras,
  recentEvents,
  activeTrajectory,
  onSelectVehicle,
  resqScenario,
  isResqActive = false
}) => {
  const { isAuthority } = useAuthRole();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showResQCorridor, setShowResQCorridor] = useState(true);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [simulationStep, setSimulationStep] = useState(0);

  // Manual test injection state
  const [testPlate, setTestPlate] = useState('DL01AB1234');
  const [testCam, setTestCam] = useState('cam-01');
  const [testType, setTestType] = useState('car');
  const [injectStatus, setInjectStatus] = useState<string | null>(null);

  useEffect(() => {
    api.getHeatmapGeoJSON().then(setHeatmapData).catch(console.error);
  }, []);

  // Animate ambulance location along ResQRoute corridor if active
  useEffect(() => {
    if (!isResqActive || !resqScenario?.optimized_resq_corridor?.waypoints?.length) return;
    const interval = setInterval(() => {
      setSimulationStep((prev) => (prev + 1) % resqScenario.optimized_resq_corridor.waypoints.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isResqActive, resqScenario]);

  const handleInjectDemoEvent = async () => {
    try {
      setInjectStatus('Injecting ANPR sighting...');
      await api.ingestEvent({
        camera_id: testCam,
        plate_text: testPlate,
        confidence: 0.97,
        vehicle_type: testType,
        color: testType === 'suv' ? 'Black' : 'White',
        speed_estimate: 54.0,
        snapshot_url: `/static/snapshots/${testCam}_${testPlate}.jpg`
      });
      setInjectStatus('Sighting Ingested! Live pin broadcasted.');
      setTimeout(() => setInjectStatus(null), 3000);
    } catch (e: any) {
      setInjectStatus(`Error: ${e.message}`);
    }
  };

  // Trajectory polyline coordinates
  const trajectoryPositions: [number, number][] = activeTrajectory?.camera_sequence?.map(
    (pt) => [pt.latitude, pt.longitude] as [number, number]
  ) || [];

  return (
    <div className="relative w-full h-[calc(100vh-125px)] rounded-2xl overflow-hidden border border-cyan-900/40 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        <GlassCard className="px-3 py-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">GIS LAYERS</span>
          </div>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
              showHeatmap
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Zone Heatmap</span>
          </button>

          <button
            onClick={() => setShowResQCorridor(!showResQCorridor)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
              showResQCorridor
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ambulance className="w-3.5 h-3.5" />
            <span>ResQRoute Corridors</span>
          </button>
        </GlassCard>

        {/* Active Trajectory Pill */}
        {activeTrajectory && (
          <GlassCard glow="cyan" className="px-3 py-2 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400 animate-spin" />
            <div className="text-xs">
              <span className="text-slate-400 font-mono">TRACKING: </span>
              <span className="font-mono font-bold text-cyan-300">{activeTrajectory.plate_number}</span>
              <span className="text-slate-400 text-[10px] ml-2">({activeTrajectory.total_distance_km} km)</span>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Manual Demo Scenario Injector Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
        <GlassCard className="p-3 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              DEMO ANPR SIGHTING INJECTOR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400">CAMERA NODE</label>
              <select
                value={testCam}
                onChange={(e) => setTestCam(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400">PLATE NUMBER</label>
              <input
                type="text"
                value={testPlate}
                onChange={(e) => setTestPlate(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleInjectDemoEvent}
            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            TRIGGER LIVE ANPR SIGHTING
          </button>

          {injectStatus && (
            <p className="text-[11px] font-mono text-emerald-400 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {injectStatus}
            </p>
          )}
        </GlassCard>
      </div>

      {/* Map Element */}
      <MapContainer
        center={[28.5950, 77.1950]}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Dark Matter / High-Tech Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 1. Camera Node Markers */}
        {cameras.map((cam) => (
          <Marker
            key={cam.id}
            position={[cam.latitude, cam.longitude]}
            icon={createCameraIcon(cam.status)}
          >
            <Popup>
              <div className="p-2 space-y-1.5 font-sans">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
                  <span className="font-bold text-cyan-300 text-xs">{cam.name}</span>
                  <StatusPill status={cam.status} />
                </div>
                <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                  <p><span className="text-slate-400">ID:</span> {cam.id}</p>
                  <p><span className="text-slate-400">ZONE:</span> {cam.zone}</p>
                  <p><span className="text-slate-400">CORRIDOR:</span> {cam.road_segment || 'N/A'}</p>
                  <p><span className="text-slate-400">TELEMETRY:</span> {cam.fps} FPS</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Live Vehicle Sighting Pins */}
        {recentEvents.slice(0, 15).map((evt) => (
          <Marker
            key={evt.id}
            position={[evt.latitude, evt.longitude]}
            icon={createVehicleIcon(evt.plate_text.includes('DL01AB') || evt.plate_text.includes('MH02CD'), evt.vehicle_type)}
          >
            <Popup>
              <div className="p-2 space-y-2 font-sans w-52">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                  <span className="font-mono font-extrabold text-sm text-cyan-300">{evt.plate_text}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {Math.round(evt.confidence * 100)}% OCR
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-300 space-y-1">
                  <p><span className="text-slate-400">TYPE:</span> {evt.vehicle_type.toUpperCase()} ({evt.color})</p>
                  <p><span className="text-slate-400">SPEED:</span> {Math.round(evt.speed_estimate)} km/h</p>
                  <p><span className="text-slate-400">CAMERA:</span> {evt.camera_name || evt.camera_id}</p>
                  <p><span className="text-slate-400">SIGHTED:</span> {new Date(evt.timestamp).toLocaleTimeString()}</p>
                </div>

                <button
                  onClick={() => onSelectVehicle(evt.vehicle_id)}
                  className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold font-mono transition-all"
                >
                  RECONSTRUCT TRAJECTORY →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Trajectory Polyline Reconstruction */}
        {trajectoryPositions.length >= 2 && (
          <Polyline
            positions={trajectoryPositions}
            pathOptions={{
              color: '#00e5ff',
              weight: 4,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* 4. ResQRoute Emergency Green Corridor */}
        {showResQCorridor && resqScenario?.optimized_resq_corridor?.waypoints && (
          <>
            {/* Normal Route (Red/Orange under heavy traffic) */}
            {resqScenario.normal_route?.waypoints && (
              <Polyline
                positions={resqScenario.normal_route.waypoints as [number, number][]}
                pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.5 }}
              />
            )}

            {/* ResQ Optimized Corridor (Glowing Emerald Green) */}
            <Polyline
              positions={resqScenario.optimized_resq_corridor.waypoints as [number, number][]}
              pathOptions={{ color: '#00e676', weight: 6, opacity: 0.9 }}
            />

            {/* Animated Ambulance position */}
            {isResqActive && resqScenario.optimized_resq_corridor.waypoints[simulationStep] && (
              <Marker
                position={resqScenario.optimized_resq_corridor.waypoints[simulationStep] as [number, number]}
                icon={createAmbulanceIcon()}
              />
            )}
          </>
        )}

        {/* 5. Zone Density Heatmap Overlay */}
        {showHeatmap && heatmapData?.features?.map((feat: any, idx: number) => {
          const level = feat.properties.density_level;
          const color = level === 'severe' ? '#ff1744' : level === 'high' ? '#ff9100' : level === 'medium' ? '#00e5ff' : '#00e676';
          
          // Leaflet expects [lat, lng] while GeoJSON is [lng, lat]
          const coords = feat.geometry.coordinates[0].map((pt: number[]) => [pt[1], pt[0]]);
          
          return (
            <Polygon
              key={idx}
              positions={coords}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-2 font-mono text-xs">
                  <p className="font-bold text-slate-200">{feat.properties.zone_name}</p>
                  <p className="text-slate-400">Volume: <span className="text-cyan-300 font-bold">{feat.properties.vehicle_count}</span> veh</p>
                  <p className="text-slate-400">Avg Speed: <span className="text-emerald-300 font-bold">{feat.properties.avg_speed_kmh}</span> km/h</p>
                  <p className="text-slate-400">Congestion Index: <span className="text-amber-300 font-bold">{feat.properties.congestion_index}</span></p>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};

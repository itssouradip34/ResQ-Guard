import React, { useState, useEffect } from 'react';
import {
  Search, Dna, Navigation, ShieldAlert, Sparkles, Clock, MapPin,
  Car, CheckCircle2, AlertTriangle, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { Vehicle, Trajectory, SearchCandidate } from '../../types';
import { api } from '../../services/api';
import { useAuthRole } from '../../context/AuthRoleContext';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

interface VehicleExplorerProps {
  onViewTrajectoryOnMap: (trajectory: Trajectory) => void;
}

export const VehicleExplorer: React.FC<VehicleExplorerProps> = ({ onViewTrajectoryOnMap }) => {
  const { isAuthority } = useAuthRole();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<any[]>([]);
  const [dnaLoading, setDnaLoading] = useState(false);

  // Natural Language Describe Search state (F-18)
  const [describeQuery, setDescribeQuery] = useState('white SUV near Central Zone this afternoon');
  const [searchCandidates, setSearchCandidates] = useState<SearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [plateFilter, setPlateFilter] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
      if (data.length > 0 && !selectedVehicle) {
        handleSelectVehicle(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectVehicle = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setDnaLoading(true);
    try {
      const [traj, sim] = await Promise.all([
        api.getTrajectory(v.id).catch(() => null),
        api.getDNASimilar(v.id).catch(() => [])
      ]);
      setTrajectory(traj);
      setSimilarVehicles(sim);
    } finally {
      setDnaLoading(false);
    }
  };

  const handleDescribeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!describeQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.describeSearch(describeQuery);
      setSearchCandidates(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleBlacklist = async () => {
    if (!selectedVehicle) return;
    const nextState = !selectedVehicle.is_blacklisted;
    const reason = nextState ? "Marked as High-Interest Target by Operator" : undefined;
    await api.toggleBlacklist(selectedVehicle.id, nextState, reason);
    loadVehicles();
  };

  return (
    <div className="space-y-6">
      {/* F-18 Multi-Modal Natural-Language Vehicle Search */}
      <GlassCard glow="cyan" className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              MULTI-MODAL NATURAL-LANGUAGE VEHICLE SEARCH (F-18)
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Describe vehicle visual attributes, time windows, and locations in plain English
            </p>
          </div>
        </div>

        <form onSubmit={handleDescribeSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={describeQuery}
              onChange={(e) => setDescribeQuery(e.target.value)}
              placeholder="e.g. 'white SUV near Central Zone this afternoon' or 'silver sedan speeding'"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isSearching ? 'SEARCHING...' : 'SEARCH ATTRIBUTES'}
          </button>
        </form>

        {/* Candidate Search Results */}
        {searchCandidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {searchCandidates.map((cand, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-300">{cand.plate_number}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800 text-[10px]">
                    {Math.round(cand.match_score * 100)}% MATCH
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>Class: <span className="text-slate-200 uppercase">{cand.vehicle_type} ({cand.color})</span></p>
                  <p>Last Sighted: <span className="text-slate-200">{cand.last_camera}</span></p>
                  <p className="text-amber-300 font-semibold">{cand.reasons.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Main Grid: Vehicle Registry List vs Selected Vehicle Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicle List */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold font-mono text-slate-200">
              TRACKED TARGET VEHICLES ({vehicles.length})
            </h4>
          </div>

          {/* Quick Plate Search & Chips */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={plateFilter}
                onChange={(e) => setPlateFilter(e.target.value)}
                placeholder="Filter by plate (e.g. DL01)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['DL01AB1234', 'MH02CD5678', 'HR26DQ5551', 'UP16CD8821'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setPlateFilter(chip);
                    const match = vehicles.find((v) => v.plate_number.includes(chip));
                    if (match) handleSelectVehicle(match);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-800 hover:border-cyan-500/40"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {vehicles
              .filter((v) => !plateFilter || v.plate_number.toUpperCase().includes(plateFilter.toUpperCase()))
              .map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-100">{v.plate_number}</span>
                    {v.is_blacklisted && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold border border-rose-500/40">
                        HOTLIST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                    <span>{v.vehicle_type.toUpperCase()} • {v.color}</span>
                    <span>{new Date(v.last_seen).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right 2 Columns: Trajectory Reconstruction & DNA Re-ID */}
        {selectedVehicle && (
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Header Details Card */}
            <GlassCard
              glow={selectedVehicle.is_blacklisted ? 'red' : 'cyan'}
              className="p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-extrabold font-mono text-cyan-300">
                      {selectedVehicle.plate_number}
                    </h3>
                    {selectedVehicle.is_blacklisted ? (
                      <StatusPill status="critical" label="HOTLIST BLACKLISTED" />
                    ) : (
                      <StatusPill status="online" label="ACTIVE PROFILE" />
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    TARGET ID: {selectedVehicle.id} • SHA-256 HASH: {selectedVehicle.plate_hash.substring(0, 16)}...
                  </p>
                </div>

                <button
                  onClick={handleToggleBlacklist}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    selectedVehicle.is_blacklisted
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-rose-500/15 border-rose-500 text-rose-300 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  }`}
                >
                  {selectedVehicle.is_blacklisted ? 'REMOVE FROM BLACKLIST' : 'ADD TO HOTLIST BLACKLIST'}
                </button>
              </div>

              {selectedVehicle.blacklist_reason && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300">
                  <span className="font-bold">HOTLIST REASON:</span> {selectedVehicle.blacklist_reason}
                </div>
              )}

              {/* Trajectory Sequence Timeline (F-06) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    MULTI-CAMERA TRAJECTORY TIMELINE (F-06)
                  </h4>

                  {trajectory && (
                    <button
                      onClick={() => onViewTrajectoryOnMap(trajectory)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                    >
                      RENDER ON GIS MAP →
                    </button>
                  )}
                </div>

                {trajectory?.camera_sequence && trajectory.camera_sequence.length > 0 ? (
                  <div className="relative border-l-2 border-cyan-500/40 ml-3 pl-4 space-y-4 py-2 font-mono text-xs">
                    {trajectory.camera_sequence.map((step, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#060d17]"></span>
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100">NODE #{idx + 1}: {step.camera_name}</span>
                            <span className="text-cyan-400 font-bold">{new Date(step.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-slate-400">
                            <span>Recorded Speed: <span className="text-emerald-400">{Math.round(step.speed_estimate)} km/h</span></span>
                            <span>OCR Confidence: <span className="text-cyan-300">{Math.round(step.confidence * 100)}%</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-500">No trajectory history recorded for this vehicle.</p>
                )}
              </div>

              {/* F-11: Vehicle DNA / Visual Re-Identification */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                      <Dna className="w-4 h-4 text-cyan-400" />
                      VEHICLE DNA / VISUAL RE-IDENTIFICATION MATCHES (F-11)
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Cosine distance matching across visual color histograms & embeddings when plates are obscured
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {similarVehicles.map((sim, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{sim.vehicle.plate_number}</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 text-[10px]">
                          {Math.round(sim.similarity_score * 100)}% SIMILARITY
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{sim.reason}</p>
                    </div>
                  ))}
                  {similarVehicles.length === 0 && (
                    <p className="text-xs font-mono text-slate-500">No visual DNA matches exceeding 60% threshold.</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

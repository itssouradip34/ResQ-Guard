import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Shield, Users, Eye, Sparkles } from 'lucide-react';
import { PublicStats } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';

export const CitizenPortalView: React.FC = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('car');
  const [color, setColor] = useState('White');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getPublicStats().then(setStats).catch(console.error);
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) return;
    try {
      await api.submitCitizenReport({
        plate_text: plate,
        vehicle_type: type,
        color,
        location_description: location,
        description
      });
      setSubmitted(true);
      setPlate('');
      setLocation('');
      setDescription('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <GlassCard glow="cyan" className="p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-mono text-slate-100 flex items-center gap-2">
              <span>CITIZEN REPORTING & PUBLIC TRANSPARENCY PORTAL (F-20)</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800">
                PRIVACY PRESERVING
              </span>
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Crowdsourced safety reporting with anonymized city-wide traffic intelligence
            </p>
          </div>
        </div>

        {/* Public Anonymized Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">MONITORED VEHICLES</span>
              <p className="text-lg font-bold text-cyan-300">{stats.monitored_vehicles_today}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">SURVEILLANCE ZONES</span>
              <p className="text-lg font-bold text-emerald-300">{stats.active_surveillance_zones} Zones</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">CORRIDOR INTERVENTIONS</span>
              <p className="text-lg font-bold text-amber-300">{stats.corridor_interventions_count}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">CITY SAFETY INDEX</span>
              <p className="text-lg font-bold text-emerald-400">{stats.safety_index_score} / 100</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Grid: Submit Report Form vs Anonymized Recent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citizen Report Form */}
        <GlassCard className="p-6 space-y-4">
          <h4 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            REPORT SUSPICIOUS VEHICLE / TRAFFIC HAZARD
          </h4>

          <form onSubmit={handleSubmitReport} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">PLATE NUMBER (IF VISIBLE)</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="e.g. DL01AB1234"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">VEHICLE TYPE</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 outline-none"
                >
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="bus">Bus</option>
                  <option value="motorbike">Motorbike</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">LOCATION DESCRIPTION *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near India Gate Roundabout, Outer Lane"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">INCIDENT DETAILS / OBSERVATION *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe reason (e.g. rash driving, hit and run, wrong way transit, stalled in traffic)..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              SUBMIT CITIZEN REPORT
            </button>

            {submitted && (
              <p className="text-emerald-400 text-xs font-mono text-center flex items-center justify-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                Report logged successfully and queued for AI verification.
              </p>
            )}
          </form>
        </GlassCard>

        {/* Anonymized Masked Live Stream */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              ANONYMIZED PUBLIC ACTIVITY FEED
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Zero Citizen PII</span>
          </div>

          <div className="space-y-2">
            {stats?.masked_recent_activity?.map((act, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-black text-cyan-300 font-extrabold border border-cyan-800 text-[11px]">
                    {act.masked_plate}
                  </span>
                  <span className="text-slate-300 uppercase">{act.vehicle_type}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{act.timestamp}</span>
                  <span className="text-emerald-400 font-bold">{act.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Activity, AlertCircle, Shield, ArrowUpRight } from 'lucide-react';
import { TrafficDashboardSummary, CongestionForecast } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { StatusPill } from '../common/StatusPill';

const TYPE_COLORS = ['#00e5ff', '#38bdf8', '#818cf8', '#f59e0b', '#ec4899', '#00e676'];

export const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<TrafficDashboardSummary | null>(null);
  const [forecasts, setForecasts] = useState<CongestionForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getCongestionForecast()
    ]).then(([sumData, foreData]) => {
      setSummary(sumData);
      setForecasts(foreData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="py-20 text-center font-mono text-cyan-400">
        <Activity className="w-8 h-8 mx-auto animate-spin mb-2" />
        Loading City-Wide Traffic Analytics...
      </div>
    );
  }

  // Format Vehicle Pie Data
  const pieData = Object.entries(summary.vehicle_type_breakdown || {}).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards (FR-08.4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard glow="cyan" className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL VEHICLES TODAY</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-cyan-300">
            {summary.total_vehicles_today.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-slate-400">Across 6 municipal camera nodes</p>
        </GlassCard>

        <GlassCard glow="amber" className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PEAK TRAFFIC HOUR</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-amber-300">
            {summary.peak_hour}
          </p>
          <p className="text-[11px] font-mono text-slate-400">{summary.peak_volume} vehicles/hr peak surge</p>
        </GlassCard>

        <GlassCard glow="none" className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOP CONGESTED ZONE</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-100">
            {summary.top_zone_by_volume}
          </p>
          <p className="text-[11px] font-mono text-slate-400">{summary.top_zone_count} sightings logged</p>
        </GlassCard>

        <GlassCard glow="green" className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CORRIDOR AVG SPEED</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            {summary.avg_speed_kmh} <span className="text-sm">km/h</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400">Flow efficiency index: Normal</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Series (FR-08.2) */}
        <GlassCard className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              HOURLY TRAFFIC VOLUME DYNAMICS
            </h3>
            <span className="text-xs font-mono text-slate-400">Rolling 24-hr window</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.hourly_series}>
                <XAxis dataKey="time_bucket" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1626', borderColor: '#1e3a5f', borderRadius: 8 }}
                  labelStyle={{ color: '#00e5ff', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="volume" stroke="#00e5ff" strokeWidth={3} dot={{ r: 4, fill: '#00e5ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Vehicle Classification Breakdown */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-slate-200">
              VEHICLE COMPOSITION
            </h3>
            <span className="text-xs font-mono text-slate-400">Classification</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1626', borderColor: '#1e3a5f', borderRadius: 8 }}
                />
                <Legend formatter={(val) => <span className="text-xs font-mono text-slate-300">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* F-14: Predictive Congestion Forecasting */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              PREDICTIVE CONGESTION FORECAST (NEXT 15 / 30 / 60 MINS)
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Markov regression forecasts on city arterial segments (F-14)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forecasts.map((fc, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{fc.road_segment_name}</span>
                <StatusPill status={fc.predicted_level as any} />
              </div>

              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p>Zone: <span className="text-slate-200">{fc.zone}</span></p>
                <p>Horizon: <span className="text-cyan-300 font-bold">{fc.predicted_time}</span></p>
                <p>Projected Density: <span className="text-amber-300 font-bold">{fc.predicted_volume}</span> vehicles/hr</p>
                {fc.speed_impact_kmh > 0 && (
                  <p className="text-rose-400 font-bold">Speed Reduction: -{fc.speed_impact_kmh} km/h</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

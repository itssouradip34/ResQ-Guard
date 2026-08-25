import React, { useState } from 'react';
import {
  MessageSquare, Send, Sparkles, Code2, Database, BarChart2,
  PieChart as PieIcon, LineChart as LineIcon, CheckCircle2, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AssistantResponse } from '../../types';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';

const SAMPLE_QUERIES = [
  "How many vehicles crossed Central Zone today?",
  "Show peak traffic hour and congestion volume",
  "How many alerts and blacklist targets are active?",
  "What is the emergency corridor time savings for ambulances?",
  "List active camera surveillance grid nodes"
];

const COLORS = ['#00e5ff', '#38bdf8', '#818cf8', '#f59e0b', '#ec4899', '#00e676'];

export const AICityAssistantView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<AssistantResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.askAssistant(q);
      setChatHistory((prev) => [res, ...prev]);
      if (!textToSend) setQuery('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <GlassCard glow="cyan" className="p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-mono text-slate-100 flex items-center gap-2">
              <span>AI CITY ASSISTANT & NATURAL-LANGUAGE QUERY (F-15)</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-700">
                SQL AUDITED
              </span>
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Translates complex municipal queries to safe SQL against whitelisted analytics views
            </p>
          </div>
        </div>

        {/* Search / Prompt Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about traffic volume, alerts, camera health, or corridors..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
          >
            <Send className="w-4 h-4" />
            {loading ? 'PROCESSING...' : 'ASK ASSISTANT'}
          </button>
        </form>

        {/* Sample Prompt Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-400">SUGGESTED QUERIES:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 transition-all text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Query History Responses */}
      <div className="space-y-4">
        {chatHistory.map((item, idx) => (
          <GlassCard key={idx} className="p-6 space-y-4">
            {/* User Question */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>QUESTION: "{item.query}"</span>
            </div>

            {/* Answer */}
            <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium">
              {item.answer}
            </p>

            {/* Structured Chart Rendering if present */}
            {item.chart_type === 'pie' && Array.isArray(item.chart_data) && (
              <div className="h-52 w-full max-w-md mx-auto pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={item.chart_data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {item.chart_data.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0b1626', borderColor: '#1e3a5f' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {item.chart_type === 'bar' && Array.isArray(item.chart_data) && (
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={item.chart_data}>
                    <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1626', borderColor: '#1e3a5f' }} />
                    <Bar dataKey="count" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {item.chart_type === 'line' && Array.isArray(item.chart_data) && (
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.chart_data}>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1626', borderColor: '#1e3a5f' }} />
                    <Line type="monotone" dataKey="volume" stroke="#38bdf8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Generated Whitelisted SQL (FR-15.2 & FR-15.3) */}
            {item.generated_sql && (
              <div className="p-3 rounded-lg bg-black/80 border border-slate-800 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    GENERATED WHITELISTED SQL
                  </span>
                  <span className="text-emerald-400">AUDITED & SAFE</span>
                </div>
                <code className="text-cyan-300 text-[11px] block overflow-x-auto">
                  {item.generated_sql}
                </code>
              </div>
            )}
          </GlassCard>
        ))}

        {chatHistory.length === 0 && (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            Select a suggested query above or type a question to inspect live city ANPR analytics.
          </div>
        )}
      </div>
    </div>
  );
};

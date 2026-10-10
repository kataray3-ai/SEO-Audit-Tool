import React from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Globe,
  PlusCircle,
  Database,
  Calendar,
  Layers,
  ChevronDown,
  Download,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentAudit,
    projects,
    activeProjectId,
    setActiveProjectId,
    isDemoMode,
    toggleDemoMode,
    setActiveTab,
  } = useAudit();

  const formattedDate = currentAudit?.started_at
    ? new Date(currentAudit.started_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No audit run';

  const score = currentAudit?.overall_score || 0;
  const scoreColor =
    score >= 85
      ? 'bg-emerald-500 text-white'
      : score >= 70
      ? 'bg-amber-500 text-white'
      : score > 0
      ? 'bg-rose-500 text-white'
      : 'bg-slate-300 text-slate-700';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: Project Selector & Domain */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="relative">
            <select
              value={activeProjectId}
              onChange={e => setActiveProjectId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({new URL(p.root_url).hostname})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Demo Mode Badge */}
        {isDemoMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-tight">
            <Database className="w-3.5 h-3.5 text-amber-700" />
            <span>Demo Data Mode</span>
            <button
              onClick={() => setActiveTab('new_audit')}
              className="ml-1 text-[11px] underline hover:text-amber-950 text-amber-800 font-normal"
            >
              (Run Live Audit)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Audit Result</span>
            <button
              onClick={() => toggleDemoMode(true)}
              className="ml-1 text-[11px] text-slate-500 hover:text-slate-800 underline font-normal"
            >
              (View Demo)
            </button>
          </div>
        )}

        {/* Crawl timestamp */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Right: Score Gauge & New Audit CTA */}
      <div className="flex items-center gap-3">
        {currentAudit && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Health Score</div>
              <div className="text-xs text-slate-700 font-medium">
                {currentAudit.coverage_summary.pages_crawled} pages audited
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs ${scoreColor}`}
              title="SEO Health Score out of 100"
            >
              {currentAudit.overall_score}
            </div>
          </div>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>

        <button
          onClick={() => setActiveTab('new_audit')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          New Audit
        </button>
      </div>
    </header>
  );
};

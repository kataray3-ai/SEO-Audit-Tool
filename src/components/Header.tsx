import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Globe,
  PlusCircle,
  Database,
  Calendar,
  ChevronDown,
  Download,
  Zap,
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
    launchQuickAudit,
    switchAudit,
  } = useAudit();

  const [quickInput, setQuickInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleHeaderAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setIsSubmitting(true);
    try {
      await launchQuickAudit(quickInput.trim());
      setQuickInput('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: Project Selector & Quick URL Bar */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="relative">
            <select
              value={activeProjectId}
              onChange={e => {
                const newId = e.target.value;
                setActiveProjectId(newId);
                const proj = projects.find(p => p.id === newId);
                if (proj && proj.last_audit_id) {
                  switchAudit(proj.last_audit_id);
                }
              }}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {projects.map(p => {
                let displayHost = p.root_url;
                try {
                  const root = p.root_url.startsWith('http') ? p.root_url : `https://${p.root_url}`;
                  displayHost = new URL(root).hostname;
                } catch {}
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({displayHost})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick URL Input inside header */}
        <form onSubmit={handleHeaderAuditSubmit} className="hidden md:flex items-center gap-1.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Audit another URL (e.g. site.com)..."
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-2.5 py-1.5 w-60 lg:w-72 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !quickInput.trim()}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-300 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"
          >
            <Zap className="w-3 h-3 fill-amber-300" />
            Audit
          </button>
        </form>

        {/* Demo Mode Badge */}
        {isDemoMode ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-tight shrink-0">
            <Database className="w-3.5 h-3.5 text-amber-700" />
            <span>Demo Data</span>
            <button
              onClick={() => setActiveTab('new_audit')}
              className="ml-1 text-[11px] underline hover:text-amber-950 text-amber-800 font-normal cursor-pointer"
            >
              (Audit Live Site)
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Audit Result</span>
            <button
              onClick={() => toggleDemoMode(true)}
              className="ml-1 text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
            >
              (Demo)
            </button>
          </div>
        )}
      </div>

      {/* Right: Score Gauge & New Audit CTA */}
      <div className="flex items-center gap-3 shrink-0">
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
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>

        <button
          onClick={() => setActiveTab('new_audit')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          New Audit
        </button>
      </div>
    </header>
  );
};

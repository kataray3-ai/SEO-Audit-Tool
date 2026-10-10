import React, { useState, useEffect } from 'react';
import { useAudit } from '../context/AuditContext';
import { Audit } from '../types/seo';
import {
  History,
  TrendingUp,
  TrendingDown,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
  const { currentAudit, switchAudit, activeProjectId } = useAudit();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [baselineId, setBaselineId] = useState<string>('audit_demo_previous');
  const [comparisonId, setComparisonId] = useState<string>('audit_demo_recent');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/audits')
      .then(res => res.json())
      .then(data => {
        setAudits(data);
        if (data.length >= 2) {
          setBaselineId(data[1].id);
          setComparisonId(data[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const runComparison = async () => {
    setIsComparing(true);
    try {
      const res = await fetch('/api/audits/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline_id: baselineId, comparison_id: comparisonId }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            Audit History & Comparison Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track historical SEO health trends, newly detected issues, and resolved engineering tickets.
          </p>
        </div>
      </div>

      {/* Audit Comparison Control Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Compare Two Audit Runs</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
          <div className="sm:col-span-5">
            <label className="block text-slate-600 font-semibold mb-1">Baseline Audit (Previous)</label>
            <select
              value={baselineId}
              onChange={e => setBaselineId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.started_at).toLocaleDateString()} - Score: {a.overall_score} ({a.coverage_summary.pages_crawled} pages)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-slate-600 font-semibold mb-1">Comparison Audit (Current)</label>
            <select
              value={comparisonId}
              onChange={e => setComparisonId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {new Date(a.started_at).toLocaleDateString()} - Score: {a.overall_score} ({a.coverage_summary.pages_crawled} pages)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={runComparison}
              disabled={isComparing || baselineId === comparisonId}
              className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
            >
              Compare Runs
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500">Score Delta</span>
                <div
                  className={`text-xl font-black font-mono mt-1 flex items-center justify-center gap-1 ${
                    comparisonResult.score_diff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {comparisonResult.score_diff >= 0 ? '+' : ''}
                  {comparisonResult.score_diff} pts
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500">Resolved Issues</span>
                <div className="text-xl font-black font-mono text-emerald-600 mt-1">
                  {comparisonResult.resolved_issues_count} fixed
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500">New Issues Found</span>
                <div className="text-xl font-black font-mono text-rose-600 mt-1">
                  {comparisonResult.new_issues_count} new
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500">Recurring Issues</span>
                <div className="text-xl font-black font-mono text-slate-700 mt-1">
                  {comparisonResult.recurring_issues_count} open
                </div>
              </div>
            </div>

            {/* Resolved Issues List */}
            {comparisonResult.resolved_issues?.length > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-xs">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolved Issues Since Baseline:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-emerald-900">
                  {comparisonResult.resolved_issues.map((i: any, idx: number) => (
                    <li key={idx}>
                      <strong>{i.title}</strong> on {i.page_url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Audits List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Saved Audit History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Audit Date</th>
                <th className="py-2.5 px-3">Project / URL</th>
                <th className="py-2.5 px-3 text-center">Pages Audited</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audits.map(a => {
                const isCurrent = currentAudit?.id === a.id;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {new Date(a.started_at).toLocaleDateString()} {new Date(a.started_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {a.project_name}
                      <span className="text-[11px] font-normal text-slate-500 block font-mono">
                        {a.root_url}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {a.coverage_summary.pages_crawled}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          a.overall_score >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.overall_score >= 65
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.overall_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-emerald-700">Currently Active</span>
                      ) : (
                        <button
                          onClick={() => switchAudit(a.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          Load Audit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

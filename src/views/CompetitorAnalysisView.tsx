import React, { useState, useEffect } from 'react';
import { useAudit } from '../context/AuditContext';
import { CompetitorComparison } from '../types/seo';
import {
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const CompetitorAnalysisView: React.FC = () => {
  const { currentAudit } = useAudit();
  const [competitors, setCompetitors] = useState<CompetitorComparison[]>([]);

  useEffect(() => {
    fetch('/api/competitors')
      .then(res => res.json())
      .then(data => setCompetitors(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Competitor SEO Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side comparative analysis of metadata coverage, schema implementation, performance, and topical gaps.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          Comparing {competitors.length} Domains
        </div>
      </div>

      {/* Side-by-side Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Comparative SEO Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-3">Competitor Domain</th>
                <th className="py-3 px-3 text-center">Title Coverage</th>
                <th className="py-3 px-3 text-center">Meta Desc</th>
                <th className="py-3 px-3 text-center">Schema Markup</th>
                <th className="py-3 px-3 text-center">Perf Score</th>
                <th className="py-3 px-3">Identified Topical Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitors.map((comp, idx) => {
                const isYourSite = idx === 0;
                return (
                  <tr
                    key={idx}
                    className={`transition ${
                      isYourSite ? 'bg-amber-50/30 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {comp.domain}
                        {isYourSite && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                            YOUR SITE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">{comp.notes}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {comp.title_coverage_pct}%
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                      {comp.meta_desc_coverage_pct}%
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {comp.schema_implemented ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                          <XCircle className="w-4 h-4 text-rose-500" /> No
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          comp.performance_score >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : comp.performance_score >= 65
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {comp.performance_score}/100
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {comp.target_topic_gaps.map((gap, gIdx) => (
                          <span
                            key={gIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]"
                          >
                            {gap}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Opportunity Takeaways */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Top Competitor SEO Takeaways
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <h4 className="font-bold text-slate-900">Content Hub Expansion</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Leading competitors like REI build deep advice libraries with gear checklists and maintenance tutorials to capture top-of-funnel informational queries.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <h4 className="font-bold text-slate-900">Performance Edge</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Your site holds a clean lightweight DOM, but TTFB lags behind edge-cached competitors like Patagonia. Improving TTFB will give you a Core Web Vitals advantage.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <h4 className="font-bold text-slate-900">Rich Schema Advantage</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Fixing the syntax error in your Product schema will immediately qualify your store for rich price and star snippet badges that Backcountry lacks on collection pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

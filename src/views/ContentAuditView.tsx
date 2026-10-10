import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Award,
  Search,
  Sparkles,
} from 'lucide-react';

export const ContentAuditView: React.FC = () => {
  const { currentAudit, currentPages, currentIssues } = useAudit();
  const [filterType, setFilterType] = useState<'all' | 'thin' | 'substantial'>('all');

  const contentIssues = currentIssues.filter(i => i.category === 'content');

  const filteredPages = currentPages.filter(p => {
    if (filterType === 'thin') return p.word_count < 250;
    if (filterType === 'substantial') return p.word_count >= 800;
    return true;
  });

  const totalWords = currentPages.reduce((acc, p) => acc + (p.word_count || 0), 0);
  const avgWords = currentPages.length > 0 ? Math.round(totalWords / currentPages.length) : 0;
  const thinPagesCount = currentPages.filter(p => p.word_count < 250).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Content Quality & E-E-A-T Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Word count analysis, thin content identification, heading distributions, and qualitative E-E-A-T trust signals.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          Content Score: <span className="text-amber-600 ml-1">{currentAudit?.category_scores.content.score || 0}/100</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Average Word Count</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{avgWords} words</div>
          <div className="text-[11px] text-slate-500 mt-1">Across crawled index</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Thin Content Flagged</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {thinPagesCount}
            <span className="text-xs text-slate-400 font-normal ml-1">(&lt; 250 words)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Vulnerable to quality filters</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Long-Form Articles</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {currentPages.filter(p => p.word_count >= 1000).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In-depth topic coverage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">E-E-A-T Trust Index</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-base font-bold">Editorial Checked</span>
          </div>
        </div>
      </div>

      {/* E-E-A-T Qualitative Guidance Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            E-E-A-T Signals Assessment
          </h3>
          <span className="text-[11px] text-slate-400">Qualitative Editorial Observations</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Google does not compute a single E-E-A-T numeric score. The following checks assess whether your website provides observable signals of Experience, Expertise, Authoritativeness, and Trustworthiness:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block">Experience</span>
            <span className="text-slate-500 text-[11px] mt-1 block">
              First-hand product testing photos, real trail usage notes, and authentic customer testimonials.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block">Expertise</span>
            <span className="text-slate-500 text-[11px] mt-1 block">
              Clear author bylines, gearhead credentials, and technical fabric specifications.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block">Authoritativeness</span>
            <span className="text-slate-500 text-[11px] mt-1 block">
              Citations from reputable wilderness organizations and established media reviews.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block">Trust</span>
            <span className="text-slate-500 text-[11px] mt-1 block">
              Transparent return policy, physical contact address, customer support, and secure checkout.
            </span>
          </div>
        </div>
      </div>

      {/* Page Word Count & Thin Content Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Page Content Breakdown</h3>
            <p className="text-xs text-slate-500">
              Filtered view of {filteredPages.length} pages
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">All Pages</option>
              <option value="thin">Thin Content (&lt; 250 words)</option>
              <option value="substantial">Substantial (&gt;= 800 words)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Page URL & Title</th>
                <th className="py-2.5 px-3">Word Count</th>
                <th className="py-2.5 px-3">Headings Outline</th>
                <th className="py-2.5 px-3 text-right">Est. Reading Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPages.map(page => (
                <tr key={page.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 align-top">
                    {page.word_count < 250 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        Thin Content
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Good Length
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 align-top max-w-sm">
                    <div className="font-bold text-slate-900">{page.title || 'Untitled'}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                      {page.final_url}
                    </div>
                  </td>
                  <td className="py-3 px-3 align-top font-mono font-bold text-slate-900">
                    {page.word_count} words
                  </td>
                  <td className="py-3 px-3 align-top text-slate-600 text-[11px]">
                    {page.h1_tags.length} H1, {page.h2_tags.length} H2
                  </td>
                  <td className="py-3 px-3 align-top text-right text-slate-600 font-mono text-[11px]">
                    ~{Math.max(1, Math.round(page.word_count / 200))} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

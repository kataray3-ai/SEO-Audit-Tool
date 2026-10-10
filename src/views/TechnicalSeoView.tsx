import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Link2,
  Lock,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';

export const TechnicalSeoView: React.FC = () => {
  const { currentAudit, currentPages, currentIssues } = useAudit();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const technicalIssues = currentIssues.filter(i => i.category === 'technical');

  const filteredIssues = technicalIssues.filter(issue => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        issue.title.toLowerCase().includes(term) ||
        issue.evidence.toLowerCase().includes(term) ||
        (issue.page_url && issue.page_url.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const statusCodeCounts = currentPages.reduce((acc, p) => {
    const code = p.status_code || 0;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Technical SEO Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crawlability, indexability, HTTP response codes, canonical directives, redirect chains, and security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
            Category Score: <span className="text-amber-600 ml-1">{currentAudit?.category_scores.technical.score || 0}/100</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">HTTP 200 Success</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {statusCodeCounts[200] || 0}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {currentPages.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">4xx & 5xx Client/Server Errors</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {Object.entries(statusCodeCounts)
              .filter(([c]) => parseInt(c, 10) >= 400)
              .reduce((a, [_, cnt]) => a + cnt, 0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Redirects (301/302)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {(statusCodeCounts[301] || 0) + (statusCodeCounts[302] || 0)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">HTTPS Protocol</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-emerald-500" />
            <span className="text-base font-bold">Secure</span>
          </div>
        </div>
      </div>

      {/* Crawl Directives & Robots.txt Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Crawl Directives Summary</h3>
          <span className="text-xs text-slate-500 font-mono">/robots.txt & Sitemaps</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-700 block">Robots.txt Presence:</span>
            <span className="text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {currentAudit?.coverage_summary.robots_txt_found ? 'Found & Parsed' : 'Not Found'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-700 block">Discovered XML Sitemaps:</span>
            <span className="text-slate-900 font-medium mt-1 block font-mono">
              {currentAudit?.coverage_summary.sitemaps_found || 0} valid sitemap file(s)
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-700 block">Average Response Latency:</span>
            <span className="text-slate-900 font-mono font-medium mt-1 block">
              {currentAudit?.coverage_summary.average_response_time_ms} ms (TTFB)
            </span>
          </div>
        </div>
      </div>

      {/* Technical Issues Table with Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Technical Issues & Violations</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredIssues.length} of {technicalIssues.length} identified issues
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search issue or URL..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 w-48 sm:w-64"
              />
            </div>

            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No technical issues match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Issue Title & Description</th>
                  <th className="py-2.5 px-3">Affected URL</th>
                  <th className="py-2.5 px-3">Evidence</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : issue.severity === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : issue.severity === 'medium'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-top max-w-xs">
                      <div className="font-bold text-slate-900">{issue.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {issue.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top font-mono text-[11px] text-slate-600 break-all max-w-[200px]">
                      {issue.page_url || currentAudit?.root_url}
                    </td>
                    <td className="py-3 px-3 align-top text-slate-700 bg-slate-50/50 rounded font-mono text-[11px] max-w-xs break-all">
                      {issue.evidence}
                    </td>
                    <td className="py-3 px-3 align-top text-right">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {issue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Crawled URL Inspection Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Crawled URLs Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">URL</th>
                <th className="py-2.5 px-3">Canonical Match</th>
                <th className="py-2.5 px-3">Depth</th>
                <th className="py-2.5 px-3 text-right">TTFB (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {currentPages.map(page => (
                <tr key={page.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        page.status_code === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : page.status_code === 301 || page.status_code === 302
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {page.status_code || 'ERR'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 truncate max-w-xs">{page.final_url}</td>
                  <td className="py-2.5 px-3">
                    {page.canonical_url ? (
                      page.is_canonical_match ? (
                        <span className="text-emerald-700">Self-Referencing</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Mismatch</span>
                      )
                    ) : (
                      <span className="text-rose-700 font-semibold">Missing</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{page.depth}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 font-bold">
                    {page.response_time_ms}ms
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

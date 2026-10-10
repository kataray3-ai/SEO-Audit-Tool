import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileJson,
  Building,
  Award,
  CheckCircle2,
  ExternalLink,
  Info,
  ShieldAlert,
  Code2,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { currentAudit, currentIssues, currentPages } = useAudit();

  const [agencyName, setAgencyName] = useState('Apex SEO Consulting');
  const [clientName, setClientName] = useState(currentAudit?.project_name || 'ApexGear Outdoors');
  const [reportTitle, setReportTitle] = useState('Comprehensive Technical SEO & Quality Audit');
  const [includeScores, setIncludeScores] = useState(true);
  const [includeIssuesTable, setIncludeIssuesTable] = useState(true);
  const [includeRoadmap, setIncludeRoadmap] = useState(true);
  const [includePerformance, setIncludePerformance] = useState(true);
  const [includeGlossary, setIncludeGlossary] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!currentAudit) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFindingsCsv = () => {
    if (!currentAudit) return;

    const headers = [
      'Issue ID',
      'Category',
      'Severity',
      'Rule ID',
      'Title',
      'Affected URL',
      'Evidence',
      'Description',
      'Recommendation',
      'Confidence',
      'Status',
      'Assigned To',
      'Internal Notes',
      'Created At',
    ];

    const escapeCsv = (str: string | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = currentIssues.map(issue => [
      escapeCsv(issue.id),
      escapeCsv(issue.category),
      escapeCsv(issue.severity),
      escapeCsv(issue.rule_id),
      escapeCsv(issue.title),
      escapeCsv(issue.page_url || currentAudit.root_url),
      escapeCsv(issue.evidence),
      escapeCsv(issue.description),
      escapeCsv(issue.recommendation),
      escapeCsv(issue.confidence),
      escapeCsv(issue.status),
      escapeCsv(issue.assigned_to || ''),
      escapeCsv(issue.notes || ''),
      escapeCsv(issue.created_at || currentAudit.started_at),
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel/Numbers automatically recognize unicode characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    let safeDomain = 'domain';
    try {
      safeDomain = new URL(currentAudit.root_url).hostname.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch {
      safeDomain = 'site';
    }
    link.href = url;
    link.download = `seo_audit_findings_${safeDomain}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const criticalAndHighIssues = currentIssues.filter(
    i => i.severity === 'critical' || i.severity === 'high'
  );

  const score = currentAudit.overall_score;
  const scoreBadgeBg =
    score >= 80 ? 'bg-emerald-600 text-white' : score >= 65 ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Interactive Toolbar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            Client Reports & Document Export Suite
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export client-ready executive PDF summaries formatted with print CSS media queries or download structured CSV audit findings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadFindingsCsv}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 active:scale-98 transition cursor-pointer"
            title="Download all verified issues and recommendations as a spreadsheet CSV"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Downloaded CSV!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Findings CSV</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-2 active:scale-98 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print to PDF
          </button>
        </div>
      </div>

      {/* Helpful Print Tip Banner (Hidden in Print) */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 print:hidden">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PDF Export Tip:</span> When the print dialog opens, set{' '}
          <strong className="underline">Destination: Save as PDF</strong> and under More settings, enable{' '}
          <strong className="underline">Background graphics</strong> to ensure category score cards, progress badges, and accent headers render with full visual fidelity.
        </div>
      </div>

      {/* Raw Data Downloads (CSV & JSON) (Hidden in Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 print:hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Raw Audit Data Downloads (CSV & JSON)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button
            onClick={handleDownloadFindingsCsv}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/30 transition flex items-center gap-3 text-xs text-left cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">Findings CSV</div>
              <div className="text-[10px] text-slate-500">{currentIssues.length} issues (Instant Export)</div>
            </div>
          </button>

          <a
            href={`/api/audits/${currentAudit.id}/export/csv-pages`}
            download
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/30 transition flex items-center gap-3 text-xs"
          >
            <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">Crawled Pages CSV</div>
              <div className="text-[10px] text-slate-500">{currentPages.length} pages</div>
            </div>
          </a>

          <a
            href={`/api/audits/${currentAudit.id}/export/csv-links`}
            download
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/30 transition flex items-center gap-3 text-xs"
          >
            <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">Internal Links CSV</div>
              <div className="text-[10px] text-slate-500">Full link graph</div>
            </div>
          </a>

          <a
            href={`/api/audits/${currentAudit.id}/export/json`}
            download
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/30 transition flex items-center gap-3 text-xs"
          >
            <FileJson className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">Complete JSON</div>
              <div className="text-[10px] text-slate-500">Structured audit object</div>
            </div>
          </a>
        </div>
      </div>

      {/* White-Label Customization Settings (Hidden in Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            PDF Customization & Report Sections
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Consultancy / Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Client Business Name</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Report Heading</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Section Inclusion Checkboxes */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeScores}
              onChange={e => setIncludeScores(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            Category Scores Summary
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includePerformance}
              onChange={e => setIncludePerformance(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            Core Web Vitals Snapshot
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeIssuesTable}
              onChange={e => setIncludeIssuesTable(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            Critical & High Issues Log
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRoadmap}
              onChange={e => setIncludeRoadmap(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            AI Engineering Roadmap
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGlossary}
              onChange={e => setIncludeGlossary(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            Stakeholder Glossary
          </label>
        </div>
      </div>

      {/* =========================================================================
          PRINTABLE CLIENT REPORT PREVIEW
          Formatted with CSS print media queries (.print-avoid-break, @media print)
         ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 font-sans text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-6">
        {/* Cover Document Header */}
        <div className="print-avoid-break pb-6 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                SEO
              </span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-700">
                {agencyName}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{reportTitle}</h1>
            <div className="text-xs text-slate-600 font-mono mt-1 space-x-3">
              <span><strong>Client:</strong> {clientName}</span>
              <span>•</span>
              <span><strong>Target:</strong> {currentAudit.root_url}</span>
              <span>•</span>
              <span><strong>Audited:</strong> {new Date(currentAudit.started_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl shadow-xs ${scoreBadgeBg}`}
            >
              {currentAudit.overall_score}
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Overall Health
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                {currentAudit.coverage_summary.pages_crawled} Pages Analyzed
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Audit Summary & Category Breakdown */}
        {includeScores && (
          <div className="print-avoid-break space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 print:hidden" />
                1. Executive Audit Summary
              </h2>
              <span className="text-xs text-slate-500 font-mono">0-100 Weighted Score Model</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              This audit report summarizes the technical hygiene, on-page optimization, content depth, Core Web Vitals, site architecture, and structured data compliance for <strong>{clientName}</strong> ({currentAudit.root_url}).
              During the crawl, <strong>{currentAudit.coverage_summary.pages_crawled} pages</strong> were discovered and evaluated across deterministic SEO rules, identifying{' '}
              <strong className="text-rose-700">{currentAudit.issue_counts.critical} critical</strong> and{' '}
              <strong className="text-amber-700">{currentAudit.issue_counts.high} high-severity</strong> items requiring prioritization.
            </p>

            {/* Category Score Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Audit Category</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Weight</th>
                    <th className="py-2.5 px-3 text-center">Passed / Applicable</th>
                    <th className="py-2.5 px-3">Status Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {Object.entries(currentAudit.category_scores).map(([cat, scoreData]) => (
                    <tr key={cat} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 capitalize">
                        {cat.replace('_', ' ')} SEO
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        <span
                          className={`px-2 py-0.5 rounded font-mono ${
                            scoreData.score >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : scoreData.score >= 65
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {scoreData.score}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                        {Math.round(scoreData.weight * 100)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-mono">
                        {scoreData.passed_checks} / {scoreData.applicable_checks}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {scoreData.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Scope Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Robots.txt</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {currentAudit.coverage_summary.robots_txt_found ? 'Verified Active' : 'Not Found'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">XML Sitemaps</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {currentAudit.coverage_summary.sitemaps_found} Declared
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Average TTFB</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                  {currentAudit.coverage_summary.average_response_time_ms} ms
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Crawl Depth</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {currentAudit.coverage_summary.crawl_depth_reached} Levels
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Core Web Vitals Snapshot */}
        {includePerformance && currentAudit.performance_data && (
          <div className="print-avoid-break space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              2. Core Web Vitals & Performance Snapshot
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Mobile */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase">Mobile Performance Strategy</span>
                  <span className="font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                    Score: {currentAudit.performance_data.mobile?.score || 0}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">LCP</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.mobile?.lab_metrics.lcp.value}s</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">CLS</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.mobile?.lab_metrics.cls.value}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">FCP</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.mobile?.lab_metrics.fcp.value}s</span>
                  </div>
                </div>
              </div>

              {/* Desktop */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase">Desktop Performance Strategy</span>
                  <span className="font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded">
                    Score: {currentAudit.performance_data.desktop?.score || 0}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">LCP</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.desktop?.lab_metrics.lcp.value}s</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">CLS</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.desktop?.lab_metrics.cls.value}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">FCP</span>
                    <span className="font-bold text-slate-900">{currentAudit.performance_data.desktop?.lab_metrics.fcp.value}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Verified Critical & High Issue Log Table */}
        {includeIssuesTable && criticalAndHighIssues.length > 0 && (
          <div className="print-avoid-break space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 print:hidden" />
                3. Critical & High Priority Issue Log
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadFindingsCsv}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded shadow-xs flex items-center gap-1.5 transition print:hidden cursor-pointer"
                  title="Download issues as CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Issues (CSV)</span>
                </button>
                <span className="text-xs text-rose-700 font-bold font-mono">
                  {criticalAndHighIssues.length} Verified Issues
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Rule & Title</th>
                    <th className="py-2.5 px-3">Affected URL</th>
                    <th className="py-2.5 px-3">Technical Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {criticalAndHighIssues.map(issue => (
                    <tr key={issue.id} className="print-avoid-break hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 align-top font-bold">
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                            issue.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-bold text-slate-900">{issue.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{issue.rule_id}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top font-mono text-[10px] text-slate-600 break-all max-w-[200px]">
                        {issue.page_url || currentAudit.root_url}
                      </td>
                      <td className="py-2.5 px-3 align-top text-slate-700 font-mono text-[10px] bg-slate-50/60 break-all max-w-xs">
                        {issue.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Prioritized Engineering Roadmap (Gemini AI Recommendations) */}
        {includeRoadmap && currentAudit.top_recommendations && currentAudit.top_recommendations.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between print-avoid-break">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 print:hidden" />
                4. Prioritized Engineering Roadmap (Action Plan)
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {currentAudit.top_recommendations.length} Action Items
              </span>
            </div>

            <div className="space-y-3.5">
              {currentAudit.top_recommendations.map((rec, i) => (
                <div
                  key={rec.recommendation_id || i}
                  className="print-avoid-break p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-xs">{rec.issue_title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {rec.estimated_effort}
                      </span>
                      <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                        Priority {rec.priority_score}/10
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed">{rec.recommended_action}</p>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Business Impact: </strong>
                    {rec.potential_business_impact}
                  </div>

                  {rec.code_example_or_rewrite && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Recommended Implementation Fix:
                      </div>
                      <pre className="p-2.5 bg-slate-900 text-amber-300 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed">
                        {rec.code_example_or_rewrite}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Non-Technical Glossary */}
        {includeGlossary && (
          <div className="print-avoid-break space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              5. SEO Glossary for Stakeholders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Canonical URL</span>
                <span className="text-slate-600 text-[11px] mt-0.5 block leading-relaxed">
                  An HTML link element specifying the master authoritative URL to prevent duplicate content indexing penalties.
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Largest Contentful Paint (LCP)</span>
                <span className="text-slate-600 text-[11px] mt-0.5 block leading-relaxed">
                  A Core Web Vital measuring how quickly the main content block renders on screen (standard threshold &le; 2.5 seconds).
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">JSON-LD Structured Data</span>
                <span className="text-slate-600 text-[11px] mt-0.5 block leading-relaxed">
                  Standardized machine-readable Schema.org annotations enabling rich snippets, pricing badges, and review stars in Google Search.
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Orphan Page</span>
                <span className="text-slate-600 text-[11px] mt-0.5 block leading-relaxed">
                  A page with no discovered inbound internal links within the site structure, hindering search crawler discovery and link equity.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="print-avoid-break pt-6 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Prepared by {agencyName} for {clientName}</span>
          <span>SEO Audit Pro AI Enterprise Edition • Confidentially Prepared</span>
        </div>
      </div>
    </div>
  );
};

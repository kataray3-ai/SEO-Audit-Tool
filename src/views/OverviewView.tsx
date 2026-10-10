import React from 'react';
import { useAudit } from '../context/AuditContext';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSearch,
  ExternalLink,
  Zap,
  Globe2,
  Lock,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const OverviewView: React.FC = () => {
  const { currentAudit, currentIssues, setActiveTab, updateIssueStatus } = useAudit();

  if (!currentAudit) {
    return (
      <div className="p-8 text-center text-slate-500">
        <FileSearch className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-700">No active audit selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an audit from the project menu or start a new crawl.</p>
        <button
          onClick={() => setActiveTab('new_audit')}
          className="mt-4 px-4 py-2 bg-amber-400 text-slate-900 font-bold text-xs rounded-lg shadow-xs hover:bg-amber-500"
        >
          Start New Audit
        </button>
      </div>
    );
  }

  const scores = currentAudit.category_scores;
  const issueCounts = currentAudit.issue_counts;

  // Chart data for category scores
  const scoreData = [
    { name: 'Technical', score: scores.technical?.score || 0, weight: '25%' },
    { name: 'On-Page', score: scores.onpage?.score || 0, weight: '20%' },
    { name: 'Content', score: scores.content?.score || 0, weight: '20%' },
    { name: 'Perf', score: scores.performance?.score || 0, weight: '15%' },
    { name: 'Links', score: scores.links?.score || 0, weight: '10%' },
    { name: 'Schema', score: scores.schema?.score || 0, weight: '10%' },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return '#10b981'; // green
    if (val >= 65) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Health Score & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Health Score Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Overall Health Score</span>
              <span className="text-xs text-slate-600 font-mono">0-100 Weighted</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <div
                className={`text-6xl font-black tracking-tight ${
                  currentAudit.overall_score >= 80
                    ? 'text-emerald-600'
                    : currentAudit.overall_score >= 65
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {currentAudit.overall_score}
              </div>
              <div className="text-slate-500 text-sm">
                / 100
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {currentAudit.overall_score >= 80
                    ? 'Good SEO Health'
                    : currentAudit.overall_score >= 65
                    ? 'Requires Optimization'
                    : 'Critical Issues Found'}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Calculated using transparent weights: Technical (25%), On-Page (20%), Content (20%), Performance (15%), Links (10%), Schema (10%).
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Audited</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {currentAudit.coverage_summary.pages_crawled}
              </div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Discovered</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {currentAudit.coverage_summary.total_urls_discovered}
              </div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Avg TTFB</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {currentAudit.coverage_summary.average_response_time_ms}ms
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown & Scores Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Category Compliance Breakdown</h3>
              <p className="text-xs text-slate-500">Deterministic scoring across 6 key SEO pillars</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> &gt;=80 Pass
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> 65-79 Needs Work
              </span>
              <span className="flex items-center gap-1 text-red-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> &lt;65 Critical
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} / 100`, 'Score']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-100 text-center">
            {scoreData.map(item => (
              <div key={item.name} className="text-xs">
                <div className="font-bold text-slate-900">{item.score}%</div>
                <div className="text-[10px] text-slate-500">{item.name} ({item.weight})</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issues Severity Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('technical')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-red-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-semibold">
            <span>Critical Issues</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{issueCounts.critical}</div>
          <div className="text-[11px] text-slate-500 mt-1">Index blocks, fatal errors</div>
        </div>

        <div
          onClick={() => setActiveTab('technical')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
            <span>High Severity</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{issueCounts.high}</div>
          <div className="text-[11px] text-slate-500 mt-1">404s, missing titles, schema</div>
        </div>

        <div
          onClick={() => setActiveTab('onpage')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
            <span>Medium Severity</span>
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{issueCounts.medium}</div>
          <div className="text-[11px] text-slate-500 mt-1">Multiple H1s, canonical quirks</div>
        </div>

        <div
          onClick={() => setActiveTab('onpage')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Low Severity</span>
            <Zap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{issueCounts.low}</div>
          <div className="text-[11px] text-slate-500 mt-1">Generic anchors, long slugs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Total Identified</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{issueCounts.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all crawl nodes</div>
        </div>
      </div>

      {/* Indexability & Signals Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Robots.txt & Sitemaps</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {currentAudit.coverage_summary.robots_txt_found ? 'Robots.txt Active' : 'Missing Robots.txt'}
              <span className="text-xs font-normal text-slate-500">
                ({currentAudit.coverage_summary.sitemaps_found} sitemap)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">SSL & Transport Security</div>
            <div className="text-sm font-bold text-slate-900">
              {currentAudit.coverage_summary.ssl_valid ? 'Valid HTTPS Protocol' : 'Insecure HTTP'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Crawl Depth Reached</div>
            <div className="text-sm font-bold text-slate-900">
              Depth level {currentAudit.coverage_summary.crawl_depth_reached}
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Priority AI Recommendations */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Priority AI Recommendations</h3>
              <p className="text-xs text-slate-500">Ranked by potential business impact and estimated implementation effort</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai_recommendations')}
            className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
          >
            View All ({currentAudit.top_recommendations?.length || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {currentAudit.top_recommendations?.slice(0, 5).map((rec, idx) => (
            <div
              key={rec.recommendation_id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{rec.issue_title}</h4>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      rec.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : rec.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.severity}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {rec.estimated_effort}
                  </span>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                    Priority: {rec.priority_score}/10
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rec.recommended_action}</p>

              <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <div className="text-[11px] text-slate-500 truncate max-w-md">
                  <span className="font-semibold text-slate-700">Affected: </span>
                  {rec.affected_urls?.join(', ')}
                </div>
                <button
                  onClick={() => setActiveTab('ai_recommendations')}
                  className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
                >
                  View Solution & Code &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

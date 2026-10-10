import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import { AIRecommendation, IssueStatus } from '../types/seo';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const AiRecommendationsView: React.FC = () => {
  const { currentAudit, updateIssueStatus } = useAudit();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Local state for recommendation statuses and notes
  const [statuses, setStatuses] = useState<Record<string, IssueStatus>>({});
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const recommendations = currentAudit?.top_recommendations || [];

  const handleStatusChange = (recId: string, status: IssueStatus) => {
    setStatuses(prev => ({ ...prev, [recId]: status }));
    // If corresponding issue exists in audit, update on server
    updateIssueStatus(recId, status, notes[recId]);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI SEO Implementation Roadmap
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized engineering action plans powered by Google Gemini, grounded in verified crawl evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-300">
            {recommendations.length} Actionable Items
          </span>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const isExpanded = expandedId === rec.recommendation_id;
          const currentStatus = statuses[rec.recommendation_id] || rec.status || 'open';

          return (
            <div
              key={rec.recommendation_id || idx}
              className={`bg-white border rounded-xl shadow-xs transition ${
                currentStatus === 'fixed'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              {/* Header row */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      rec.priority_score >= 8
                        ? 'bg-rose-500 text-white'
                        : rec.priority_score >= 6
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    P{rec.priority_score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{rec.issue_title}</h3>
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
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.recommended_action}</p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <select
                    value={currentStatus}
                    onChange={e => handleStatusChange(rec.recommendation_id, e.target.value as any)}
                    className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      currentStatus === 'fixed'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : currentStatus === 'in_progress'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : currentStatus === 'dismissed'
                        ? 'bg-slate-100 border-slate-300 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="fixed">Mark Fixed</option>
                    <option value="dismissed">Dismiss</option>
                  </select>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rec.recommendation_id)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsed quick summary */}
              {!isExpanded && (
                <div className="px-5 pb-4 pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100/80">
                  <span className="text-[11px] truncate max-w-sm">
                    <strong>Evidence:</strong> {rec.evidence}
                  </span>
                  <button
                    onClick={() => setExpandedId(rec.recommendation_id)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                  >
                    View Code & Steps &rarr;
                  </button>
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                  {/* Business Impact & Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-slate-800 block">Verified Finding Evidence:</span>
                      <p className="text-slate-600 font-mono text-[11px] leading-relaxed">{rec.evidence}</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-slate-800 block">Potential Business Impact:</span>
                      <p className="text-slate-600 leading-relaxed">{rec.potential_business_impact}</p>
                    </div>
                  </div>

                  {/* Implementation Steps */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <span className="font-bold text-slate-800 block">Step-by-Step Implementation Guide:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700 leading-relaxed">
                      {rec.implementation_steps?.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Code Fix Example if available */}
                  {rec.code_example_or_rewrite && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-amber-500" />
                          Recommended Code Fix / Rule Configuration:
                        </span>
                        <button
                          onClick={() => handleCopy(rec.code_example_or_rewrite!, rec.recommendation_id)}
                          className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-xs"
                        >
                          {copiedCodeId === rec.recommendation_id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" /> Copy Fix
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-amber-300 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                        {rec.code_example_or_rewrite}
                      </pre>
                    </div>
                  )}

                  {/* Verification Steps */}
                  {rec.verification_steps && rec.verification_steps.length > 0 && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-slate-700">
                      <span className="font-bold text-slate-800 block">Post-Deployment Verification:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                        {rec.verification_steps.map((v, vIdx) => (
                          <li key={vIdx}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Assignee & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Assignee
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Front-end Dev, SEO Specialist"
                        value={assignees[rec.recommendation_id] || ''}
                        onChange={e =>
                          setAssignees({ ...assignees, [rec.recommendation_id]: e.target.value })
                        }
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Internal Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Add engineering or staging notes..."
                        value={notes[rec.recommendation_id] || ''}
                        onChange={e =>
                          setNotes({ ...notes, [rec.recommendation_id]: e.target.value })
                        }
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

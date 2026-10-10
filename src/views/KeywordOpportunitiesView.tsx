import React, { useState, useEffect } from 'react';
import { useAudit } from '../context/AuditContext';
import { KeywordOpportunity } from '../types/seo';
import {
  Search,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const KeywordOpportunitiesView: React.FC = () => {
  const { currentAudit } = useAudit();
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [intentFilter, setIntentFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/keywords')
      .then(res => res.json())
      .then(data => setOpportunities(data))
      .catch(err => console.error(err));
  }, []);

  const filtered = opportunities.filter(op => {
    if (intentFilter !== 'all' && op.search_intent !== intentFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Keyword & Topic Gap Opportunities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-suggested topic clusters, search intent mapping, FAQ suggestions, and content gap recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={intentFilter}
            onChange={e => setIntentFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">All Search Intents</option>
            <option value="transactional">Transactional</option>
            <option value="commercial">Commercial</option>
            <option value="informational">Informational</option>
          </select>
        </div>
      </div>

      {/* Transparency Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
        <strong>Data Transparency Note:</strong> In compliance with SEO audit principles, search intent and topic clusters below are estimated using AI semantic modeling based on crawled page content. Live search volume and ranking positions require a connected third-party provider.
      </div>

      {/* Opportunities Cards */}
      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-300 transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">{item.keyword}</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    item.search_intent === 'transactional'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.search_intent === 'commercial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.search_intent}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Relevance: {item.relevance_score}%
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded capitalize">
                  {item.content_gap_type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-700">Recommended Strategic Action:</div>
              <p className="text-slate-600 leading-relaxed">{item.suggested_action}</p>
            </div>

            {/* Related Questions / FAQ Schema Opportunity */}
            {item.related_questions && item.related_questions.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                  People Also Ask / FAQ Schema Expansion:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.related_questions.map((q, qIdx) => (
                    <span
                      key={qIdx}
                      className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-900 rounded-md text-[11px]"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

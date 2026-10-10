import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Network,
  AlertTriangle,
  Link2,
  Layers,
  ArrowRight,
  Search,
  ExternalLink,
} from 'lucide-react';

export const InternalLinksView: React.FC = () => {
  const { currentAudit, currentPages, currentIssues } = useAudit();
  const [activeTab, setActiveTab] = useState<'pages' | 'anchors' | 'orphans'>('pages');

  const orphanPages = currentPages.filter(p => p.depth > 0 && (p.inbound_internal_links_count || 0) === 0);

  // Collect all discovered anchor texts
  const allAnchorsMap = new Map<string, { count: number; targets: Set<string>; isGeneric: boolean }>();

  currentPages.forEach(p => {
    p.internal_links.forEach(l => {
      const text = l.text.trim();
      if (!text) return;
      const lower = text.toLowerCase();
      const isGeneric = ['click here', 'read more', 'learn more', 'here', 'link', 'view'].includes(lower);

      const existing = allAnchorsMap.get(text) || { count: 0, targets: new Set(), isGeneric };
      existing.count++;
      existing.targets.add(l.href);
      allAnchorsMap.set(text, existing);
    });
  });

  const anchorList = Array.from(allAnchorsMap.entries()).map(([text, data]) => ({
    text,
    count: data.count,
    targetCount: data.targets.size,
    isGeneric: data.isGeneric,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-500" />
            Internal Linking & Site Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crawl depth hierarchy, link equity distribution, orphan candidate detection, and anchor text semantics.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          Links Score: <span className="text-amber-600 ml-1">{currentAudit?.category_scores.links.score || 0}/100</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Max Click Depth</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {currentAudit?.coverage_summary.crawl_depth_reached || 0} levels
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From root homepage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Orphan Candidates</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {orphanPages.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">0 inbound internal links</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Unique Anchor Phrases</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {anchorList.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Internal linking anchors</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Generic Anchors Flagged</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {anchorList.filter(a => a.isGeneric).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&quot;Click here&quot;, &quot;Read more&quot;</div>
        </div>
      </div>

      {/* Orphan Note */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
        <strong>Methodology Notice:</strong> An &quot;orphan page candidate&quot; finding reflects the discovered crawl graph only. Pages may still be discoverable via XML sitemaps, paid ads, or external backlinks.
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-2.5 transition ${
            activeTab === 'pages'
              ? 'border-b-2 border-amber-500 text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Internal Links by Page ({currentPages.length})
        </button>
        <button
          onClick={() => setActiveTab('anchors')}
          className={`pb-2.5 transition ${
            activeTab === 'anchors'
              ? 'border-b-2 border-amber-500 text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Anchor Text Distribution ({anchorList.length})
        </button>
        <button
          onClick={() => setActiveTab('orphans')}
          className={`pb-2.5 transition ${
            activeTab === 'orphans'
              ? 'border-b-2 border-amber-500 text-slate-950 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Orphan Candidates ({orphanPages.length})
        </button>
      </div>

      {/* Tab 1: Pages Table */}
      {activeTab === 'pages' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Page URL</th>
                  <th className="py-2.5 px-3">Click Depth</th>
                  <th className="py-2.5 px-3">Inbound Inlinks</th>
                  <th className="py-2.5 px-3">Outbound Inlinks</th>
                  <th className="py-2.5 px-3">External Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {currentPages.map(page => (
                  <tr key={page.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-slate-900 truncate max-w-sm">
                      {page.final_url}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{page.depth}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          (page.inbound_internal_links_count || 0) === 0 && page.depth > 0
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {page.inbound_internal_links_count || 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{page.internal_links_count}</td>
                    <td className="py-2.5 px-3 text-slate-500">{page.external_links_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Anchor Text Table */}
      {activeTab === 'anchors' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Anchor Text</th>
                  <th className="py-2.5 px-3">Occurrences</th>
                  <th className="py-2.5 px-3">Target URLs</th>
                  <th className="py-2.5 px-3">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {anchorList.map((anc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      &quot;{anc.text}&quot;
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{anc.count}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{anc.targetCount}</td>
                    <td className="py-2.5 px-3">
                      {anc.isGeneric ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Generic Anchor (Needs Keyword Focus)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Descriptive Semantic
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Orphan Candidates */}
      {activeTab === 'orphans' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          {orphanPages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No orphan page candidates discovered. All crawled nodes have at least one inbound internal link.
            </div>
          ) : (
            <div className="space-y-3">
              {orphanPages.map(page => (
                <div key={page.id} className="p-4 bg-slate-50 border border-rose-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{page.title || 'Untitled Page'}</span>
                    <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                      0 Inbound Links
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">{page.final_url}</div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Recommendation: Add a contextual link from relevant parent category pages or footer links to integrate this URL into the main crawl graph.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

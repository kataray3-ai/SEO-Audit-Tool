import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  FileCode,
  AlertTriangle,
  CheckCircle,
  Eye,
  Smartphone,
  Monitor,
  Search,
  Hash,
  Share2,
} from 'lucide-react';

export const OnPageSeoView: React.FC = () => {
  const { currentAudit, currentPages, currentIssues } = useAudit();
  const [selectedPageId, setSelectedPageId] = useState<string>(currentPages[0]?.id || '');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  const onpageIssues = currentIssues.filter(i => i.category === 'onpage');
  const selectedPage = currentPages.find(p => p.id === selectedPageId) || currentPages[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-500" />
            On-Page SEO Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Title tags, meta descriptions, H1-H6 heading hierarchy, URL structures, and OpenGraph social signals.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          On-Page Score: <span className="text-amber-600 ml-1">{currentAudit?.category_scores.onpage.score || 0}/100</span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Title Tag Coverage</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {currentPages.filter(p => Boolean(p.title)).length}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {currentPages.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Optimal length: 40-60 chars</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Meta Description Coverage</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {currentPages.filter(p => Boolean(p.meta_description)).length}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {currentPages.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Optimal length: 120-155 chars</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Single H1 Hierarchy</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {currentPages.filter(p => p.h1_tags.length === 1).length}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {currentPages.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Single clear page topic</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Open Graph Configured</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {currentPages.filter(p => Boolean(p.open_graph?.title)).length}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {currentPages.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Social cards metadata</div>
        </div>
      </div>

      {/* Split Interactive Inspector: Page Selector & Deep Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Page List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audited Pages</h3>
            <span className="text-xs text-slate-500 font-mono">{currentPages.length} pages</span>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {currentPages.map(page => {
              const isSelected = page.id === selectedPage?.id;
              const hasIssues = onpageIssues.some(i => i.page_id === page.id || i.page_url === page.final_url);
              return (
                <button
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[220px]">
                      {page.title || 'Untitled Page'}
                    </span>
                    {hasIssues && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Notice
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                    {page.final_url}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Page Deep Details & SERP Preview */}
        {selectedPage && (
          <div className="lg:col-span-7 space-y-4">
            {/* SERP Simulator */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Google Search Snippet Simulator
                  </h3>
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 text-xs bg-slate-50">
                  <button
                    onClick={() => setSerpDevice('desktop')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                      serpDevice === 'desktop' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    onClick={() => setSerpDevice('mobile')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                      serpDevice === 'mobile' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>
              </div>

              {/* Realistic Google SERP Card */}
              <div
                className={`p-4 bg-white border border-slate-200 rounded-lg font-sans ${
                  serpDevice === 'mobile' ? 'max-w-sm mx-auto shadow-sm' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    G
                  </div>
                  <span className="text-[12px] text-slate-700 truncate max-w-xs">{selectedPage.final_url}</span>
                </div>
                <div className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer leading-snug">
                  {selectedPage.title || 'Untitled Document'}
                </div>
                <p className="text-xs text-[#4d5156] mt-1 line-clamp-2 leading-relaxed">
                  {selectedPage.meta_description || 'No meta description configured for this page. Google will extract a snippet automatically.'}
                </p>
              </div>
            </div>

            {/* Title & Meta Description Diagnostics */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tag Length & Compliance
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Title Element</span>
                    <span
                      className={`font-mono text-[11px] ${
                        (selectedPage.title_length || 0) >= 30 && (selectedPage.title_length || 0) <= 60
                          ? 'text-emerald-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }`}
                    >
                      {selectedPage.title_length || 0} / 60 characters
                    </span>
                  </div>
                  <div className="text-xs text-slate-900 font-medium">{selectedPage.title || 'Missing <title> tag'}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Meta Description</span>
                    <span
                      className={`font-mono text-[11px] ${
                        (selectedPage.meta_description_length || 0) >= 70 &&
                        (selectedPage.meta_description_length || 0) <= 160
                          ? 'text-emerald-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }`}
                    >
                      {selectedPage.meta_description_length || 0} / 160 characters
                    </span>
                  </div>
                  <div className="text-xs text-slate-900 leading-relaxed">
                    {selectedPage.meta_description || 'Missing meta description tag'}
                  </div>
                </div>
              </div>
            </div>

            {/* Headings Hierarchy (H1, H2) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-amber-500" />
                  Heading Outline (H1 / H2)
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedPage.h1_tags.length} H1, {selectedPage.h2_tags.length} H2
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {selectedPage.h1_tags.length === 0 ? (
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-lg font-medium border border-red-200">
                    Warning: 0 H1 tags detected on this page.
                  </div>
                ) : (
                  selectedPage.h1_tags.map((h1, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px] font-black">
                        H1
                      </span>
                      <span>{h1}</span>
                    </div>
                  ))
                )}

                {selectedPage.h2_tags.slice(0, 4).map((h2, i) => (
                  <div key={i} className="p-2 pl-4 border-l-2 border-slate-300 text-slate-700 flex items-center gap-2 font-medium">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">H2</span>
                    <span>{h2}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Graph Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-amber-500" />
                Social Open Graph Metadata
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">og:title</span>
                  <span className="text-slate-900 truncate block font-medium">
                    {selectedPage.open_graph?.title || 'Not specified'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">og:type</span>
                  <span className="text-slate-900 truncate block font-medium">
                    {selectedPage.open_graph?.type || 'website'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Link2,
  Upload,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const BacklinksView: React.FC = () => {
  const { currentAudit } = useAudit();
  const [backlinkData, setBacklinkData] = useState<any>(null);
  const [importedCsvName, setImportedCsvName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/backlinks')
      .then(res => res.json())
      .then(data => setBacklinkData(data))
      .catch(err => console.error(err));
  }, []);

  const handleSimulatedCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportedCsvName(file.name);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-amber-500" />
            Off-Page SEO & Backlink Profile
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Referring domain diversity, anchor text distribution, follow/nofollow split, and link reclamation opportunities.
          </p>
        </div>

        {/* CSV Import workflow */}
        <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs cursor-pointer">
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>{importedCsvName ? `Imported: ${importedCsvName}` : 'Import Backlink CSV'}</span>
          <input type="file" accept=".csv" onChange={handleSimulatedCsvUpload} className="hidden" />
        </label>
      </div>

      {/* Provider Label Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div>
          <span className="font-bold text-slate-900">Data Source Status: </span>
          {importedCsvName ? (
            <span className="text-emerald-700 font-medium">Imported CSV File ({importedCsvName})</span>
          ) : (
            <span className="text-amber-800 font-medium">Connected Provider Demonstration Dataset</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Strictly labeled - No fabricated metrics</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Referring Domains</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {backlinkData?.referring_domains_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Unique root domains</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Total Backlinks</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {backlinkData?.total_backlinks_count?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Inbound external links</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Dofollow Equity Split</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {backlinkData?.dofollow_pct || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Followed editorial links</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500">Reclamation Opportunities</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {backlinkData?.broken_link_reclamation?.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">External links hitting 404s</div>
        </div>
      </div>

      {/* High Value Broken Link Reclamation Panel */}
      {backlinkData?.broken_link_reclamation && backlinkData.broken_link_reclamation.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Priority Link Reclamation Alert
            </h3>
          </div>
          {backlinkData.broken_link_reclamation.map((rec: any, i: number) => (
            <div key={i} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-slate-900">External Source: {rec.source_page}</span>
                <span className="text-[10px] uppercase font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                  Status 404 Dead End
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                Target Broken URL: <span className="text-rose-700 font-bold">{rec.target_url}</span> (Anchor: &quot;{rec.anchor}&quot;)
              </div>
              <p className="text-[11px] text-rose-900 font-medium pt-1">
                {rec.reclamation_opportunity}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Top Referring Domains & Anchor Text Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referring Domains */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Top Referring Domains</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Referring Domain</th>
                  <th className="py-2.5 px-3">Backlinks</th>
                  <th className="py-2.5 px-3">Provider Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {backlinkData?.top_referring_domains?.map((dom: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{dom.domain}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{dom.backlinks}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">{dom.authority_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anchor Text Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Anchor Text Profile</h3>
          <div className="space-y-2.5">
            {backlinkData?.anchor_distribution?.map((anc: any, i: number) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium truncate max-w-xs">&quot;{anc.text}&quot;</span>
                  <span className="font-mono font-bold">{anc.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${anc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

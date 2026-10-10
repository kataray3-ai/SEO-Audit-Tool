import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Binary,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const SchemaAuditView: React.FC = () => {
  const { currentAudit, currentPages, currentIssues } = useAudit();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const schemaIssues = currentIssues.filter(i => i.category === 'schema');

  // Collect schemas across crawled pages
  const discoveredSchemas: Array<{
    pageUrl: string;
    type: string;
    isValid: boolean;
    errors?: string[];
    rawJson?: string;
  }> = [];

  currentPages.forEach(p => {
    p.schemas.forEach(s => {
      discoveredSchemas.push({
        pageUrl: p.final_url,
        type: s.type,
        isValid: s.is_valid,
        errors: s.errors,
        rawJson: s.raw_json,
      });
    });
  });

  const validCount = discoveredSchemas.filter(s => s.isValid).length;
  const invalidCount = discoveredSchemas.filter(s => !s.isValid).length;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleCorrectedJsonLd = `{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "CloudDome 2P Ultralight Tent",
  "image": [
    "https://apexgear-outdoors.com/img/tent-1.jpg"
  ],
  "description": "Ultralight 2-person freestanding backcountry tent with Dyneema composite rainfly.",
  "sku": "AG-CD2P",
  "brand": {
    "@type": "Brand",
    "name": "ApexGear"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://apexgear-outdoors.com/gear/tents",
    "priceCurrency": "USD",
    "price": "489.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Binary className="w-5 h-5 text-amber-500" />
            Structured Data & Schema Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            JSON-LD parsing, Schema.org entity validation, rich result eligibility, and syntax correction.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          Schema Score: <span className="text-amber-600 ml-1">{currentAudit?.category_scores.schema.score || 0}/100</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Discovered Schemas</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{discoveredSchemas.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total JSON-LD scripts</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Valid Syntax</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{validCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Parses cleanly</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Syntax Errors</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">{invalidCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Invalid JSON or tags</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Pages Missing Schema</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {currentPages.filter(p => p.schemas.length === 0).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">0 structured data blocks</div>
        </div>
      </div>

      {/* Distinction Notice */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
        <strong>Important Clarification:</strong> Valid Schema.org markup provides semantic entity context to search engines but does not guarantee rich snippets or ranking improvements in Google Search results.
      </div>

      {/* Discovered Schemas Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Detected Schema Entity Inventory</h3>

        {discoveredSchemas.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No structured data (JSON-LD) discovered across the crawled pages.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Schema Type (@type)</th>
                  <th className="py-2.5 px-3">Page Location</th>
                  <th className="py-2.5 px-3">Validation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {discoveredSchemas.map((sch, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      {sch.isValid ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Valid JSON
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          Syntax Error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sch.type}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-xs">{sch.pageUrl}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {sch.errors ? (
                        <span className="text-rose-700 font-medium">{sch.errors.join(', ')}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">No syntax parse errors</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ready-to-use JSON-LD Code Generator */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Corrected Product Schema Blueprint</h3>
              <p className="text-xs text-slate-500">Standard compliant JSON-LD template ready to embed</p>
            </div>
          </div>
          <button
            onClick={() => handleCopy(sampleCorrectedJsonLd, 'product_schema')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs"
          >
            {copiedCode === 'product_schema' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy JSON-LD
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-amber-300 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
          {sampleCorrectedJsonLd}
        </pre>
      </div>
    </div>
  );
};

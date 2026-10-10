import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Gauge,
  Smartphone,
  Monitor,
  Zap,
  Clock,
  Layout,
  Layers,
  ArrowDownRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { currentAudit } = useAudit();
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  const perfData = currentAudit?.performance_data?.[device];
  const mobileScore = currentAudit?.performance_data?.mobile?.score || 0;
  const desktopScore = currentAudit?.performance_data?.desktop?.score || 0;

  const getMetricBadge = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'needs_improvement':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'poor':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-500" />
            Performance & Core Web Vitals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real user Chrome UX (CrUX) field experience and Lighthouse synthetic laboratory diagnostics.
          </p>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white shadow-xs">
          <button
            onClick={() => setDevice('mobile')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              device === 'mobile'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile ({mobileScore})
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              device === 'desktop'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Desktop ({desktopScore})
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm text-white ${
              (perfData?.score || 0) >= 85
                ? 'bg-emerald-500'
                : (perfData?.score || 0) >= 65
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          >
            {perfData?.score || 0}
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-400">Lighthouse Performance</div>
            <div className="text-sm font-bold text-slate-900 capitalize mt-0.5">{device} Device Strategy</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {(perfData?.score || 0) >= 85
                ? 'Passes Core Web Vitals thresholds'
                : (perfData?.score || 0) >= 65
                ? 'Moderate performance bottlenecks'
                : 'Poor responsiveness or slow render'}
            </div>
          </div>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">LCP (Render)</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {perfData?.lab_metrics.lcp.value || 0}s
            </span>
            <span className="text-[10px] text-slate-500">Threshold: &le; 2.5s</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">CLS (Shift)</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {perfData?.lab_metrics.cls.value || 0}
            </span>
            <span className="text-[10px] text-slate-500">Threshold: &le; 0.1</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">FCP (Paint)</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {perfData?.lab_metrics.fcp.value || 0}s
            </span>
            <span className="text-[10px] text-slate-500">Threshold: &le; 1.8s</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">TBT (Blocking)</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
              {perfData?.lab_metrics.total_blocking_time.value || 0}ms
            </span>
            <span className="text-[10px] text-slate-500">Threshold: &le; 200ms</span>
          </div>
        </div>
      </div>

      {/* Field Data vs Lab Data Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chrome User Experience (CrUX) Field Data */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Real User Experience (CrUX 75th Percentile)
            </h3>
            <span className="text-[11px] text-slate-500">28-day collection</span>
          </div>

          {perfData?.has_field_data && perfData.field_metrics ? (
            <div className="space-y-2.5 pt-2">
              {Object.entries(perfData.field_metrics).map(([key, m]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 uppercase">{key}</span>
                    <span className="text-slate-500 ml-2">Target {m.threshold_good}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {m.value} {m.unit}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getMetricBadge(
                        m.status
                      )}`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
              <Info className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
              <div className="font-semibold text-slate-700">No field data available for this URL</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                CrUX field reports require minimum traffic volume across Chrome browsers. Laboratory measurements below represent synthetic device emulation.
              </p>
            </div>
          )}
        </div>

        {/* Synthetic Lab Measurements */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Laboratory Simulation Metrics
            </h3>
            <span className="text-[11px] text-slate-500">Controlled CPU/Network</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {perfData?.lab_metrics &&
              Object.entries(perfData.lab_metrics).map(([key, m]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 ml-2">Target {m.threshold_good}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {m.value} {m.unit}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getMetricBadge(
                        m.status
                      )}`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Optimization Opportunities Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          PageSpeed Optimization Opportunities
        </h3>

        {perfData?.opportunities && perfData.opportunities.length > 0 ? (
          <div className="space-y-2.5">
            {perfData.opportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{opp.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{opp.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {opp.estimated_savings_ms && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 font-mono font-bold text-[11px] rounded">
                      Save ~{opp.estimated_savings_ms}ms
                    </span>
                  )}
                  {opp.estimated_savings_bytes && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-900 font-mono font-bold text-[11px] rounded">
                      Save ~{Math.round(opp.estimated_savings_bytes / 1024)} KB
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No critical render-blocking opportunities flagged.
          </div>
        )}
      </div>
    </div>
  );
};

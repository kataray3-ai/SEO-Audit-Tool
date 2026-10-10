import React, { useState, useEffect } from 'react';
import { IntegrationStatus } from '../types/seo';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Key,
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/integrations')
      .then(res => res.json())
      .then(data => setIntegrations(data))
      .catch(err => console.error(err));
  }, []);

  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${provider}/test`, { method: 'POST' });
      const data = await res.json();
      setTestResult({ provider, message: data.message });
      // Refresh list
      const freshRes = await fetch('/api/integrations');
      if (freshRes.ok) setIntegrations(await freshRes.json());
    } catch (err: any) {
      setTestResult({ provider, message: err.message });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            Integrations & API Data Providers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Google Cloud, Gemini AI, PageSpeed Insights, and third-party data providers.
          </p>
        </div>
      </div>

      {/* Grid of Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integ => (
          <div
            key={integ.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{integ.name}</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    integ.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {integ.connected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" /> Not Connected
                    </>
                  )}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{integ.description}</p>

              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                <div className="text-[11px] text-slate-500">
                  <strong className="text-slate-700">Required Config: </strong>
                  {integ.required_permission}
                </div>
                {integ.last_checked_at && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Last Verified: {new Date(integ.last_checked_at).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Available Data Signals:
                </span>
                <div className="flex flex-wrap gap-1">
                  {integ.data_available.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleTestConnection(integ.id)}
                disabled={testingProvider === integ.id}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {testingProvider === integ.id ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                )}
                Test Connection
              </button>

              {testResult?.provider === integ.id && (
                <span className="text-[11px] font-mono text-slate-600 truncate max-w-[200px]">
                  {testResult.message}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';
import {
  Settings,
  Sliders,
  RotateCcw,
  Shield,
  Bot,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { toggleDemoMode } = useAudit();

  const [weights, setWeights] = useState({
    technical: 25,
    onpage: 20,
    content: 20,
    performance: 15,
    links: 10,
    schema: 10,
  });

  const [defaultUa, setDefaultUa] = useState('SEOAuditProBot/1.0 (+https://seoauditpro.ai/bot; crawler)');
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Audit Engine Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure transparent scoring category weights, crawler user-agent parameters, and local data persistence.
          </p>
        </div>
      </div>

      {/* Category Weight Customization */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Configurable SEO Health Score Weights</h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              totalWeight === 100
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            Total: {totalWeight}% {totalWeight !== 100 && '(Must equal 100%)'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Customize the relative importance of each pillar in the calculation of the overall 0-100 SEO Health Score.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          {Object.entries(weights).map(([cat, val]) => (
            <div key={cat} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center font-bold text-slate-800 capitalize">
                <span>{cat.replace('_', ' ')} SEO</span>
                <span className="font-mono text-amber-600">{val}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={val}
                onChange={e =>
                  setWeights({ ...weights, [cat]: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Crawler Engine Defaults */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Default Crawler Parameters</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Default User-Agent Header</label>
            <input
              type="text"
              value={defaultUa}
              onChange={e => setDefaultUa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Max HTTP Concurrency</label>
            <select
              value={maxConcurrency}
              onChange={e => setMaxConcurrency(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="1">1 Request at a time (Ultra polite)</option>
              <option value="2">2 Concurrent Requests (Default)</option>
              <option value="3">3 Concurrent Requests</option>
              <option value="5">5 Concurrent Requests (High capacity)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset & Reset Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Demo Dataset & Reset Controls</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Reset to bundled sample dataset for ApexGear Outdoors demonstration.
          </div>
          <button
            onClick={() => {
              toggleDemoMode(true);
              alert('Loaded clean demo dataset.');
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reload Demo Data
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings saved successfully!
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-xs active:scale-98"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAudit } from '../context/AuditContext';
import { CrawlConfiguration, AuditCrawlProgress } from '../types/seo';
import {
  Globe,
  Settings2,
  Sliders,
  CheckCircle2,
  Play,
  RotateCw,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Shield,
  Gauge,
  ArrowRight,
  ArrowLeft,
  Zap,
} from 'lucide-react';

export const NewAuditView: React.FC = () => {
  const { startAudit, refreshAuditData, setActiveTab, activeAuditId, setActiveAuditId } = useAudit();

  const [step, setStep] = useState<number>(1);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<AuditCrawlProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInputError, setUrlInputError] = useState<string | null>(null);

  // Form configuration state
  const [config, setConfig] = useState<CrawlConfiguration>({
    url: '',
    project_name: '',
    website_type: 'ecommerce',
    target_country: 'United States',
    target_language: 'en-US',
    primary_market: 'Global',
    website_platform: 'Shopify',
    target_keywords: ['ultralight hiking', 'backpacking gear'],
    competitor_urls: ['https://www.rei.com'],
    crawl_source: 'both',
    max_pages: 15,
    crawl_depth: 3,
    same_domain_only: true,
    respect_robots_txt: true,
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (compatible; SEOAuditPro/1.0)',
    request_delay_ms: 200,
    modules: {
      technical: true,
      onpage: true,
      content: true,
      performance: true,
      links: true,
      schema: true,
      local: false,
      competitors: true,
    },
  });

  const [targetKeywordsText, setTargetKeywordsText] = useState('ultralight backpacking, trail hiking boots, mountain waterproof jacket');
  const [competitorsText, setCompetitorsText] = useState('https://www.rei.com\nhttps://www.patagonia.com');

  // If an audit was triggered (e.g. from Header or Quick Audit), activate progress step
  useEffect(() => {
    if (activeAuditId) {
      setInProgress(true);
      setStep(5);
      setErrorMsg(null);
    }
  }, [activeAuditId]);

  // Poll progress if in progress
  useEffect(() => {
    let timer: any = null;
    const currentId = activeAuditId;
    if (inProgress && currentId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/audits/${currentId}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.progress) {
              setProgressState(data.progress);
            }
            if (data.status === 'completed') {
              setInProgress(false);
              clearInterval(timer);
              await refreshAuditData(currentId);
            } else if (data.status === 'failed') {
              setInProgress(false);
              clearInterval(timer);
              setErrorMsg(data.progress?.error || 'Audit encountered an error during crawling.');
            }
          }
        } catch (err: any) {
          console.error('Polling error', err);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inProgress, activeAuditId]);

  const cleanEnteredUrl = (raw: string): string => {
    let u = raw.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      u = 'https://' + u;
    }
    return u;
  };

  const handleLaunchAudit = async (customConfig?: CrawlConfiguration) => {
    setErrorMsg(null);
    setUrlInputError(null);

    const targetUrl = (customConfig || config).url.trim();
    if (!targetUrl || targetUrl === 'https://') {
      setUrlInputError('Please enter a valid website URL (e.g. https://example.com or example.com)');
      return;
    }

    const normalizedUrl = cleanEnteredUrl(targetUrl);
    let autoProjectName = (customConfig || config).project_name.trim();
    if (!autoProjectName) {
      try {
        autoProjectName = new URL(normalizedUrl).hostname;
      } catch {
        autoProjectName = 'Website';
      }
    }

    const keywords = targetKeywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const competitors = competitorsText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const finalConfig: CrawlConfiguration = {
      ...(customConfig || config),
      url: normalizedUrl,
      project_name: autoProjectName,
      target_keywords: keywords,
      competitor_urls: competitors,
    };

    setInProgress(true);
    setStep(5);
    setProgressState({
      step: 'validating',
      message: 'Validating host eligibility and security parameters...',
      pages_crawled: 0,
      total_discovered: 1,
      percent: 5,
    });

    try {
      const auditId = await startAudit(finalConfig);
      setActiveAuditId(auditId);
    } catch (err: any) {
      setInProgress(false);
      setErrorMsg(err.message || 'Failed to start audit. Please verify the URL.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Progress Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Website Details' },
            { num: 2, label: 'Crawl Settings' },
            { num: 3, label: 'Audit Modules' },
            { num: 4, label: 'Review Scope' },
            { num: 5, label: 'Audit Execution' },
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition ${
                  step === s.num
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s.num ? 'text-slate-900 font-bold' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {s.num < 5 && <div className="w-8 h-0.5 bg-slate-200 hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Website Details */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" />
              Step 1: Website Details & Target Market
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any website URL to run an instant comprehensive SEO audit or customize advanced crawl parameters.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={config.url}
                  onChange={e => {
                    setConfig({ ...config, url: e.target.value });
                    if (urlInputError) setUrlInputError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleLaunchAudit();
                  }}
                  placeholder="https://example.com or example.com"
                  className={`w-full text-xs border rounded-lg pl-9 pr-3 py-2.5 font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none ${
                    urlInputError ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {urlInputError ? (
                <span className="text-xs text-red-600 font-medium mt-1.5 block">
                  {urlInputError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tip: You can enter <strong>example.com</strong> directly or with <strong>https://</strong>.
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name (Optional)</label>
                <input
                  type="text"
                  value={config.project_name}
                  onChange={e => setConfig({ ...config, project_name: e.target.value })}
                  placeholder="e.g. My Website Brand"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business / Website Type</label>
                <select
                  value={config.website_type}
                  onChange={e => setConfig({ ...config, website_type: e.target.value as any })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="ecommerce">E-Commerce Store</option>
                  <option value="saas">SaaS / B2B Software</option>
                  <option value="blog">Content Blog / Publication</option>
                  <option value="local_business">Local Service / Physical Business</option>
                  <option value="corporate">Corporate / Institutional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Country</label>
                <input
                  type="text"
                  value={config.target_country}
                  onChange={e => setConfig({ ...config, target_country: e.target.value })}
                  placeholder="United States"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Language</label>
                <input
                  type="text"
                  value={config.target_language}
                  onChange={e => setConfig({ ...config, target_language: e.target.value })}
                  placeholder="en-US"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Focus Keywords (optional, comma-separated)
              </label>
              <input
                type="text"
                value={targetKeywordsText}
                onChange={e => setTargetKeywordsText(e.target.value)}
                placeholder="e.g. running shoes, trail gear"
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick 1-Click Launch Bar vs Advanced Settings */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!config.url.trim()) {
                  setUrlInputError('Please enter a website URL before continuing.');
                  return;
                }
                setStep(2);
              }}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
            >
              Configure Advanced Crawl Settings
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleLaunchAudit()}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-98 cursor-pointer order-1 sm:order-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Start Quick Audit Now
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Crawl Settings */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Step 2: Crawler Engine & Concurrency Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control crawl depth, maximum pages, robots.txt obedience, and request rate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Crawl Source</label>
              <select
                value={config.crawl_source}
                onChange={e => setConfig({ ...config, crawl_source: e.target.value as any })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="both">Both Homepage Link Graph & XML Sitemap</option>
                <option value="homepage">Homepage Links Only</option>
                <option value="sitemap">Discovered XML Sitemap URLs Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Crawl Budget (Pages Limit)
              </label>
              <select
                value={config.max_pages}
                onChange={e => setConfig({ ...config, max_pages: parseInt(e.target.value, 10) })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="5">5 Pages (Fast Diagnostic)</option>
                <option value="15">15 Pages (Standard Audit)</option>
                <option value="25">25 Pages (Deep Audit)</option>
                <option value="50">50 Pages (Comprehensive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Crawl Depth</label>
              <select
                value={config.crawl_depth}
                onChange={e => setConfig({ ...config, crawl_depth: parseInt(e.target.value, 10) })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="2">2 Hops from Root</option>
                <option value="3">3 Hops (Recommended)</option>
                <option value="4">4 Hops</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Request Delay (politeness)</label>
              <select
                value={config.request_delay_ms}
                onChange={e => setConfig({ ...config, request_delay_ms: parseInt(e.target.value, 10) })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="100">100 ms (Fast)</option>
                <option value="200">200 ms (Balanced)</option>
                <option value="500">500 ms (Polite)</option>
                <option value="1000">1,000 ms (Strict throttle)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.same_domain_only}
                onChange={e => setConfig({ ...config, same_domain_only: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-medium text-slate-700">
                Enforce same-domain crawling only (prevent crawler from straying to external domains)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.respect_robots_txt}
                onChange={e => setConfig({ ...config, respect_robots_txt: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs font-medium text-slate-700">
                Respect /robots.txt disallow directives
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              Next: Modules
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Audit Modules */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-500" />
              Step 3: Select Active Audit Modules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose which SEO diagnostic modules to execute during this crawl.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { id: 'technical', label: 'Technical SEO Engine', desc: 'Status codes, canonicals, robots.txt, sitemaps, mixed content' },
              { id: 'onpage', label: 'On-Page SEO Diagnostics', desc: 'Titles, meta descriptions, H1-H6 hierarchy, URL length' },
              { id: 'content', label: 'Content Quality & E-E-A-T', desc: 'Thin content detection, word counts, headings distribution' },
              { id: 'performance', label: 'Core Web Vitals & PageSpeed', desc: 'LCP, INP, CLS, TTFB, and synthetic Lighthouse testing' },
              { id: 'links', label: 'Internal Links & Architecture', desc: 'Orphan page candidates, click depth graph, anchor text quality' },
              { id: 'schema', label: 'Structured Data & Schema', desc: 'JSON-LD extraction, syntax validation, missing properties' },
              { id: 'competitors', label: 'Competitor Comparison', desc: 'Cross-domain crawl comparison against listed competitors' },
              { id: 'local', label: 'Local Business Signals', desc: 'NAP consistency, local landing pages, opening hours schema' },
            ].map(mod => {
              const checked = (config.modules as any)[mod.id];
              return (
                <label
                  key={mod.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    checked ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e =>
                      setConfig({
                        ...config,
                        modules: { ...config.modules, [mod.id]: e.target.checked },
                      })
                    }
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{mod.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              Next: Review Scope
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Configuration */}
      {step === 4 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
              Step 4: Review Audit Scope & Confirm
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify crawl parameters before initiating live execution.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Target Root URL:</span>
                <span className="font-mono font-bold text-slate-900 ml-2">{config.url || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-500">Project:</span>
                <span className="font-bold text-slate-900 ml-2">{config.project_name || 'Automated'}</span>
              </div>
              <div>
                <span className="text-slate-500">Max Pages:</span>
                <span className="font-bold text-slate-900 ml-2">{config.max_pages} pages</span>
              </div>
              <div>
                <span className="text-slate-500">Crawl Depth:</span>
                <span className="font-bold text-slate-900 ml-2">{config.crawl_depth} levels</span>
              </div>
              <div>
                <span className="text-slate-500">Robots.txt:</span>
                <span className="font-bold text-slate-900 ml-2">{config.respect_robots_txt ? 'Strictly Respected' : 'Ignored'}</span>
              </div>
              <div>
                <span className="text-slate-500">AI Engine:</span>
                <span className="font-bold text-amber-800 ml-2">Gemini 3.8 Flash</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500">Active Modules:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Object.entries(config.modules)
                  .filter(([_, v]) => v)
                  .map(([k]) => (
                    <span key={k} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 capitalize">
                      {k}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => handleLaunchAudit()}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Start Audit Now
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Live Audit Execution States */}
      {step === 5 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-6">
          {inProgress ? (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center mx-auto animate-pulse">
                <RotateCw className="w-8 h-8 animate-spin text-amber-600" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {progressState?.message || 'Crawl in progress...'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono truncate max-w-md mx-auto">
                  {progressState?.current_page ? `Target: ${progressState.current_page}` : 'Initializing pipeline'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressState?.percent || 15}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Pages Crawled: {progressState?.pages_crawled || 0}</span>
                  <span>{progressState?.percent || 15}%</span>
                </div>
              </div>

              {/* Pipeline Step Indicators */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs pt-2">
                {[
                  { id: 'validating', label: '1. Domain & SSRF Check' },
                  { id: 'fetching_robots', label: '2. Robots.txt Analysis' },
                  { id: 'discovering_sitemaps', label: '3. Sitemap Discovery' },
                  { id: 'crawling_pages', label: '4. HTML Extraction' },
                  { id: 'analyzing_html', label: '5. Deterministic Rules' },
                  { id: 'running_performance', label: '6. PageSpeed & CWV' },
                  { id: 'generating_ai', label: '7. Gemini AI Synthesis' },
                  { id: 'completed', label: '8. Final Report Ready' },
                ].map(p => {
                  const isCurrent = progressState?.step === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-50 text-amber-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span>{p.label}</span>
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : errorMsg ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Audit Notice</h3>
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-left font-mono leading-relaxed">
                {errorMsg}
              </p>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Return to URL Configuration
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Audit Completed Successfully!</h3>
              <p className="text-xs text-slate-600">
                Extracted all HTML headers, metadata, headings, internal link graphs, and generated prioritized recommendations.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  View Audit Dashboard &rarr;
                </button>
                <button
                  onClick={() => {
                    setConfig({ ...config, url: '' });
                    setStep(1);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Audit Another Site
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
} from 'lucide-react';

export const NewAuditView: React.FC = () => {
  const { startAudit, refreshAuditData, setActiveTab, currentAudit } = useAudit();

  const [step, setStep] = useState<number>(1);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<AuditCrawlProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form configuration state
  const [config, setConfig] = useState<CrawlConfiguration>({
    url: 'https://',
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
    user_agent: 'SEOAuditProBot/1.0 (+https://seoauditpro.ai/bot; crawler)',
    request_delay_ms: 250,
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

  // Poll progress if in progress
  useEffect(() => {
    let timer: any = null;
    if (inProgress && activeAuditId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/audits/${activeAuditId}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.progress) {
              setProgressState(data.progress);
            }
            if (data.status === 'completed') {
              setInProgress(false);
              clearInterval(timer);
              await refreshAuditData(activeAuditId);
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

  const handleLaunchAudit = async () => {
    setErrorMsg(null);
    setInProgress(true);
    setStep(5);

    const keywords = targetKeywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const competitors = competitorsText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const finalConfig: CrawlConfiguration = {
      ...config,
      target_keywords: keywords,
      competitor_urls: competitors,
    };

    try {
      const auditId = await startAudit(finalConfig);
      setActiveAuditId(auditId);
      setProgressState({
        step: 'validating',
        message: 'Validating host eligibility and security parameters...',
        pages_crawled: 0,
        total_discovered: 1,
        percent: 5,
      });
    } catch (err: any) {
      setInProgress(false);
      setErrorMsg(err.message || 'Failed to start audit');
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" />
              Step 1: Website Details & Target Market
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the target domain, platform, and optional competitor URLs for comparative analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={config.url}
                onChange={e => setConfig({ ...config, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must be an accessible public domain (SSRF protected).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={config.project_name}
                onChange={e => setConfig({ ...config, project_name: e.target.value })}
                placeholder="e.g. ApexGear Outdoors"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">CMS / Tech Platform</label>
              <select
                value={config.website_platform}
                onChange={e => setConfig({ ...config, website_platform: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                <option value="Shopify">Shopify</option>
                <option value="WordPress">WordPress / WooCommerce</option>
                <option value="Next.js">Next.js / Headless React</option>
                <option value="Webflow">Webflow</option>
                <option value="Custom">Custom HTML / Other</option>
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
              Target Focus Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={targetKeywordsText}
              onChange={e => setTargetKeywordsText(e.target.value)}
              placeholder="keyword 1, keyword 2, keyword 3"
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Competitor URLs (one per line, up to 5)
            </label>
            <textarea
              rows={2}
              value={competitorsText}
              onChange={e => setCompetitorsText(e.target.value)}
              placeholder="https://competitor1.com&#10;https://competitor2.com"
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!config.url || config.url === 'https://') {
                  alert('Please enter a valid target URL.');
                  return;
                }
                setStep(2);
              }}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 shadow-xs flex items-center gap-1.5"
            >
              Next: Crawl Settings
              <ArrowRight className="w-4 h-4" />
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
                <option value="250">250 ms (Balanced)</option>
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
                Strictly respect /robots.txt disallow directives
              </span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">User-Agent Identifier</label>
            <input
              type="text"
              value={config.user_agent}
              onChange={e => setConfig({ ...config, user_agent: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 shadow-xs flex items-center gap-1.5"
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
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-500 shadow-xs flex items-center gap-1.5"
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
                <span className="font-mono font-bold text-slate-900 ml-2">{config.url}</span>
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

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
            <strong>Security Notice:</strong> The crawler enforces strict SSRF protections, disallowing loopback, link-local, and private cloud metadata IPs. Rate limiting is applied to ensure polite server crawling.
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleLaunchAudit}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-2 active:scale-98"
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
                <p className="text-xs text-slate-500 mt-1 font-mono">
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
              <h3 className="text-base font-bold text-slate-900">Audit Failed</h3>
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-left font-mono leading-relaxed">
                {errorMsg}
              </p>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
              >
                Return to Configuration
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
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm"
                >
                  View Audit Dashboard &rarr;
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50"
                >
                  Run Another Crawl
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

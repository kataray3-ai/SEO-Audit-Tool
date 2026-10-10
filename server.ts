import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { store } from './server/storage.js';
import { executeCrawl } from './server/crawler.js';
import { evaluateSEO } from './server/rules.js';
import { generateAIRecommendations } from './server/gemini.js';
import { fetchPageSpeedData } from './server/pagespeed.js';
import { validatePublicUrl } from './server/ssrf.js';
import {
  CrawlConfiguration,
  Audit,
  Project,
} from './src/types/seo.js';
import {
  DEMO_COMPETITORS,
  DEMO_KEYWORDS,
  DEMO_BACKLINKS,
} from './server/demo-data.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      gemini_configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // URL Security / SSRF Validation endpoint
  app.post('/api/validate-url', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ valid: false, error: 'URL is required' });
    }
    const result = await validatePublicUrl(url);
    res.json(result);
  });

  // Projects
  app.get('/api/projects', (req: Request, res: Response) => {
    res.json(store.getProjects());
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    const { name, root_url, website_type, target_country, target_language } = req.body;
    if (!name || !root_url) {
      return res.status(400).json({ error: 'Name and root_url are required' });
    }

    const newProject: Project = {
      id: `proj_${Math.random().toString(36).substring(2, 9)}`,
      name,
      root_url,
      website_type: website_type || 'ecommerce',
      target_country: target_country || 'United States',
      target_language: target_language || 'en-US',
      created_at: new Date().toISOString(),
      audit_count: 0,
    };

    store.saveProject(newProject);
    res.status(201).json(newProject);
  });

  // Audits
  app.get('/api/audits', (req: Request, res: Response) => {
    const projectId = req.query.project_id as string | undefined;
    res.json(store.getAudits(projectId));
  });

  app.get('/api/audits/:id', (req: Request, res: Response) => {
    const audit = store.getAudit(req.params.id);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(audit);
  });

  // Audit Status / Progress polling
  app.get('/api/audits/:id/status', (req: Request, res: Response) => {
    const progress = store.getProgress(req.params.id);
    const audit = store.getAudit(req.params.id);
    res.json({
      status: audit?.status || 'unknown',
      progress: progress || null,
      audit: audit || null,
    });
  });

  // Start New Audit (Asynchronous background processing with live progress states)
  app.post('/api/audits', async (req: Request, res: Response) => {
    const config: CrawlConfiguration = req.body;
    if (!config || !config.url) {
      return res.status(400).json({ error: 'Valid URL configuration required' });
    }

    // SSRF Check
    const validation = await validatePublicUrl(config.url);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const targetHostname = new URL(validation.normalizedUrl!).hostname;

    // Match existing project by root domain (excluding demo project when domain differs)
    let matchedProject = store.getProjects().find(p => {
      try {
        const root = p.root_url.startsWith('http') ? p.root_url : `https://${p.root_url}`;
        const h = new URL(root).hostname;
        return h.toLowerCase() === targetHostname.toLowerCase();
      } catch {
        return false;
      }
    });

    const projectId = matchedProject
      ? matchedProject.id
      : `proj_${Math.random().toString(36).substring(2, 9)}`;

    const auditId = `audit_${Math.random().toString(36).substring(2, 9)}`;

    const initialAudit: Audit = {
      id: auditId,
      project_id: projectId,
      project_name: config.project_name || targetHostname,
      root_url: validation.normalizedUrl!,
      status: 'crawling',
      started_at: new Date().toISOString(),
      crawl_configuration: config,
      coverage_summary: {
        pages_crawled: 0,
        total_urls_discovered: 0,
        crawl_depth_reached: 0,
        robots_txt_found: false,
        sitemaps_found: 0,
        average_response_time_ms: 0,
        ssl_valid: validation.normalizedUrl!.startsWith('https://'),
      },
      overall_score: 0,
      category_scores: {
        technical: { score: 0, weight: 0.25, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
        onpage: { score: 0, weight: 0.2, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
        content: { score: 0, weight: 0.2, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
        performance: { score: 0, weight: 0.15, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
        links: { score: 0, weight: 0.1, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
        schema: { score: 0, weight: 0.1, applicable_checks: 0, passed_checks: 0, failed_checks: 0, skipped_checks: 0, coverage_percent: 0, explanation: 'Pending evaluation' },
      },
      issue_counts: { critical: 0, high: 0, medium: 0, low: 0, informational: 0, total: 0 },
      top_recommendations: [],
      is_demo: false,
    };

    store.saveAudit(initialAudit);

    // Save or update project
    if (!matchedProject) {
      const newProject: Project = {
        id: projectId,
        name: config.project_name || targetHostname,
        root_url: validation.normalizedUrl!,
        website_type: config.website_type || 'ecommerce',
        target_country: config.target_country || 'United States',
        target_language: config.target_language || 'en-US',
        created_at: new Date().toISOString(),
        last_audit_id: auditId,
        audit_count: 1,
      };
      store.saveProject(newProject);
    } else {
      matchedProject.last_audit_id = auditId;
      matchedProject.audit_count = (matchedProject.audit_count || 0) + 1;
      store.saveProject(matchedProject);
    }

    // Return response immediately so frontend starts polling / watching progress
    res.status(202).json({
      audit_id: auditId,
      project_id: projectId,
      status: 'crawling',
      message: 'Audit started successfully',
    });

    // Execute crawl in background process
    (async () => {
      try {
        const crawlResult = await executeCrawl(config, progress => {
          store.setProgress(auditId, progress);
        });

        store.setProgress(auditId, {
          step: 'analyzing_html',
          message: 'Running deterministic Technical and On-Page SEO validation rules...',
          pages_crawled: crawlResult.pages.length,
          total_discovered: crawlResult.pages.length,
          percent: 85,
        });

        // Attach audit ID to all crawled pages
        crawlResult.pages.forEach(p => {
          p.audit_id = auditId;
        });
        store.savePages(auditId, crawlResult.pages);

        // Run Deterministic SEO evaluation
        const evaluation = evaluateSEO({
          pages: crawlResult.pages,
          robots: crawlResult.robots,
          sitemap: crawlResult.sitemap,
          auditId,
        });

        store.saveIssues(auditId, evaluation.issues);

        // Run PageSpeed Insights if performance module is enabled
        let performanceData: Audit['performance_data'] = undefined;
        if (config.modules.performance) {
          store.setProgress(auditId, {
            step: 'running_performance',
            message: 'Querying Google PageSpeed Insights & Core Web Vitals...',
            pages_crawled: crawlResult.pages.length,
            total_discovered: crawlResult.pages.length,
            percent: 90,
          });

          const [mobilePerf, desktopPerf] = await Promise.all([
            fetchPageSpeedData(config.url, 'mobile'),
            fetchPageSpeedData(config.url, 'desktop'),
          ]);

          if (mobilePerf || desktopPerf) {
            performanceData = {
              mobile: mobilePerf || undefined,
              desktop: desktopPerf || undefined,
            };
          }
        }

        // Generate AI Recommendations using Gemini
        store.setProgress(auditId, {
          step: 'generating_ai',
          message: 'Generating prioritized AI recommendations & custom code snippets...',
          pages_crawled: crawlResult.pages.length,
          total_discovered: crawlResult.pages.length,
          percent: 95,
        });

        let recommendations = [];
        try {
          recommendations = await generateAIRecommendations(
            evaluation.issues,
            crawlResult.pages,
            config
          );
        } catch (recErr: any) {
          console.warn('AI recommendation generation error:', recErr.message);
        }

        // Calculate issue severity distribution
        const issueCounts = {
          critical: evaluation.issues.filter(i => i.severity === 'critical').length,
          high: evaluation.issues.filter(i => i.severity === 'high').length,
          medium: evaluation.issues.filter(i => i.severity === 'medium').length,
          low: evaluation.issues.filter(i => i.severity === 'low').length,
          informational: evaluation.issues.filter(i => i.severity === 'informational').length,
          total: evaluation.issues.length,
        };

        const totalResponseTime = crawlResult.pages.reduce((acc, p) => acc + (p.response_time_ms || 0), 0);
        const avgResponseTime = crawlResult.pages.length > 0 ? Math.round(totalResponseTime / crawlResult.pages.length) : 0;
        const maxDepth = crawlResult.pages.reduce((acc, p) => Math.max(acc, p.depth || 0), 0);

        const completedAudit: Audit = {
          ...initialAudit,
          status: 'completed',
          completed_at: new Date().toISOString(),
          coverage_summary: {
            pages_crawled: crawlResult.pages.length,
            total_urls_discovered: crawlResult.pages.length + crawlResult.sitemap.urls.length,
            crawl_depth_reached: maxDepth,
            robots_txt_found: crawlResult.robots.exists,
            sitemaps_found: crawlResult.sitemap.found ? 1 : 0,
            average_response_time_ms: avgResponseTime,
            ssl_valid: validation.normalizedUrl!.startsWith('https://'),
          },
          overall_score: evaluation.overallScore,
          category_scores: evaluation.categoryScores,
          issue_counts: issueCounts,
          top_recommendations: recommendations,
          performance_data: performanceData,
        };

        store.saveAudit(completedAudit);
        store.setProgress(auditId, {
          step: 'completed',
          message: 'Audit completed successfully!',
          pages_crawled: crawlResult.pages.length,
          total_discovered: crawlResult.pages.length,
          percent: 100,
        });
      } catch (err: any) {
        console.error('Audit run failed:', err);
        const failedAudit = store.getAudit(auditId);
        if (failedAudit) {
          failedAudit.status = 'failed';
          store.saveAudit(failedAudit);
        }
        store.setProgress(auditId, {
          step: 'failed',
          message: `Audit failed: ${err.message}`,
          pages_crawled: 0,
          total_discovered: 0,
          percent: 100,
          error: err.message,
        });
      }
    })();
  });

  // Pages of an audit
  app.get('/api/audits/:id/pages', (req: Request, res: Response) => {
    const pages = store.getPages(req.params.id);
    res.json(pages);
  });

  // Issues of an audit
  app.get('/api/audits/:id/issues', (req: Request, res: Response) => {
    let issues = store.getIssues(req.params.id);
    const { category, severity, status } = req.query;

    if (category) {
      issues = issues.filter(i => i.category === category);
    }
    if (severity) {
      issues = issues.filter(i => i.severity === severity);
    }
    if (status) {
      issues = issues.filter(i => i.status === status);
    }

    res.json(issues);
  });

  // Update Issue Status (e.g., Mark as Fixed, In Progress, Dismissed)
  app.patch('/api/audits/:id/issues/:issueId', (req: Request, res: Response) => {
    const { status, notes } = req.body;
    store.updateIssueStatus(req.params.id, req.params.issueId, status, notes);
    res.json({ success: true, status, notes });
  });

  // Competitor Analysis endpoint
  app.get('/api/competitors', (req: Request, res: Response) => {
    res.json(DEMO_COMPETITORS);
  });

  // Keyword Opportunities endpoint
  app.get('/api/keywords', (req: Request, res: Response) => {
    res.json(DEMO_KEYWORDS);
  });

  // Backlink Analysis endpoint
  app.get('/api/backlinks', (req: Request, res: Response) => {
    res.json(DEMO_BACKLINKS);
  });

  // Integrations endpoint
  app.get('/api/integrations', (req: Request, res: Response) => {
    res.json(store.getIntegrations());
  });

  // Test integration endpoint
  app.post('/api/integrations/:provider/test', async (req: Request, res: Response) => {
    const provider = req.params.provider;
    if (provider === 'gemini') {
      const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
      res.json({
        connected: hasKey,
        message: hasKey
          ? 'Gemini API key is configured and ready.'
          : 'GEMINI_API_KEY is not set or using placeholder.',
      });
    } else if (provider === 'pagespeed') {
      const hasKey = Boolean(process.env.PAGESPEED_API_KEY);
      res.json({
        connected: hasKey,
        message: hasKey
          ? 'Google PageSpeed Insights API key is configured.'
          : 'PageSpeed key not found. Public rate-limited tier will be used.',
      });
    } else {
      res.json({
        connected: false,
        message: `Direct OAuth connection for ${provider} requires Google Cloud OAuth credentials configured.`,
      });
    }
  });

  // Audit Comparison
  app.post('/api/audits/compare', (req: Request, res: Response) => {
    const { baseline_id, comparison_id } = req.body;
    const base = store.getAudit(baseline_id);
    const comp = store.getAudit(comparison_id);

    if (!base || !comp) {
      return res.status(404).json({ error: 'One or both audits not found' });
    }

    const baseIssues = store.getIssues(base.id);
    const compIssues = store.getIssues(comp.id);

    const baseRuleMap = new Set(baseIssues.map(i => `${i.rule_id}::${i.page_url || ''}`));
    const compRuleMap = new Set(compIssues.map(i => `${i.rule_id}::${i.page_url || ''}`));

    const resolved = baseIssues.filter(i => !compRuleMap.has(`${i.rule_id}::${i.page_url || ''}`));
    const newlyDiscovered = compIssues.filter(i => !baseRuleMap.has(`${i.rule_id}::${i.page_url || ''}`));
    const recurring = compIssues.filter(i => baseRuleMap.has(`${i.rule_id}::${i.page_url || ''}`));

    res.json({
      score_diff: comp.overall_score - base.overall_score,
      baseline_score: base.overall_score,
      comparison_score: comp.overall_score,
      baseline_date: base.started_at,
      comparison_date: comp.started_at,
      resolved_issues_count: resolved.length,
      new_issues_count: newlyDiscovered.length,
      recurring_issues_count: recurring.length,
      resolved_issues: resolved,
      newly_discovered_issues: newlyDiscovered,
    });
  });

  // EXPORTS
  // CSV Export: Issues
  app.get('/api/audits/:id/export/csv-issues', (req: Request, res: Response) => {
    const issues = store.getIssues(req.params.id);
    const headers = ['Issue ID', 'Category', 'Severity', 'Rule ID', 'Title', 'Affected URL', 'Evidence', 'Recommendation', 'Status'];
    const rows = issues.map(i => [
      `"${i.id}"`,
      `"${i.category}"`,
      `"${i.severity}"`,
      `"${i.rule_id}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${(i.page_url || '').replace(/"/g, '""')}"`,
      `"${(i.evidence || '').replace(/"/g, '""')}"`,
      `"${(i.recommendation || '').replace(/"/g, '""')}"`,
      `"${i.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="seo_issues_${req.params.id}.csv"`);
    res.send(csvContent);
  });

  // CSV Export: Pages
  app.get('/api/audits/:id/export/csv-pages', (req: Request, res: Response) => {
    const pages = store.getPages(req.params.id);
    const headers = ['Page ID', 'URL', 'Final URL', 'Status Code', 'Depth', 'Title', 'Title Length', 'Meta Desc Length', 'Canonical URL', 'Word Count', 'Internal Links Count', 'Response Time (ms)'];
    const rows = pages.map(p => [
      `"${p.id}"`,
      `"${(p.url || '').replace(/"/g, '""')}"`,
      `"${(p.final_url || '').replace(/"/g, '""')}"`,
      p.status_code,
      p.depth,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.title_length || 0,
      p.meta_description_length || 0,
      `"${(p.canonical_url || '').replace(/"/g, '""')}"`,
      p.word_count || 0,
      p.internal_links_count || 0,
      p.response_time_ms || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="crawled_pages_${req.params.id}.csv"`);
    res.send(csvContent);
  });

  // CSV Export: Internal Links
  app.get('/api/audits/:id/export/csv-links', (req: Request, res: Response) => {
    const pages = store.getPages(req.params.id);
    const headers = ['Source URL', 'Target URL', 'Anchor Text', 'Rel Attribute'];
    const rows: string[] = [];

    for (const page of pages) {
      for (const link of page.internal_links) {
        rows.push([
          `"${page.final_url.replace(/"/g, '""')}"`,
          `"${link.href.replace(/"/g, '""')}"`,
          `"${(link.text || '').replace(/"/g, '""')}"`,
          `"${link.rel || ''}"`,
        ].join(','));
      }
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="internal_links_${req.params.id}.csv"`);
    res.send(csvContent);
  });

  // JSON Export
  app.get('/api/audits/:id/export/json', (req: Request, res: Response) => {
    const audit = store.getAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    const pages = store.getPages(req.params.id);
    const issues = store.getIssues(req.params.id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit_${req.params.id}.json"`);
    res.json({
      audit,
      pages,
      issues,
      exported_at: new Date().toISOString(),
    });
  });

  // ==========================================
  // STATIC ASSETS / VITE DEV MIDDLEWARE
  // ==========================================
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SEO Audit Pro AI running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

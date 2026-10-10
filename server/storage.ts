import {
  Audit,
  CrawledPage,
  SEOIssue,
  Project,
  AuditCrawlProgress,
  IntegrationStatus,
} from '../src/types/seo.js';
import {
  DEMO_PROJECT,
  DEMO_AUDIT,
  DEMO_PREVIOUS_AUDIT,
  DEMO_PAGES,
  DEMO_ISSUES,
} from './demo-data.js';

class InMemoryStore {
  projects: Map<string, Project> = new Map();
  audits: Map<string, Audit> = new Map();
  pages: Map<string, CrawledPage[]> = new Map();
  issues: Map<string, SEOIssue[]> = new Map();
  progressMap: Map<string, AuditCrawlProgress> = new Map();
  integrations: Map<string, IntegrationStatus> = new Map();

  constructor() {
    this.seedDemoData();
    this.seedIntegrations();
  }

  seedDemoData() {
    this.projects.set(DEMO_PROJECT.id, DEMO_PROJECT);
    this.audits.set(DEMO_AUDIT.id, DEMO_AUDIT);
    this.audits.set(DEMO_PREVIOUS_AUDIT.id, DEMO_PREVIOUS_AUDIT);
    this.pages.set(DEMO_AUDIT.id, [...DEMO_PAGES]);
    this.issues.set(DEMO_AUDIT.id, [...DEMO_ISSUES]);
  }

  seedIntegrations() {
    const defaultIntegrations: IntegrationStatus[] = [
      {
        id: 'gemini',
        provider: 'gemini',
        name: 'Google Gemini AI',
        description: 'Generative AI recommendation engine and content intelligence using Gemini 3.8 Flash model.',
        connected: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        required_permission: 'Server-side GEMINI_API_KEY environment variable',
        data_available: ['Executive AI analysis', 'Custom code fixes', 'Content topic clustering', 'Priority scoring'],
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 'pagespeed',
        provider: 'pagespeed',
        name: 'Google PageSpeed Insights API',
        description: 'Real user Chrome UX (CrUX) field data and Lighthouse synthetic lab performance audits.',
        connected: Boolean(process.env.PAGESPEED_API_KEY),
        required_permission: 'PAGESPEED_API_KEY (or public quota rate limit)',
        data_available: ['Mobile & Desktop Core Web Vitals', 'Largest Contentful Paint', 'Interaction to Next Paint', 'Cumulative Layout Shift'],
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 'search_console',
        provider: 'search_console',
        name: 'Google Search Console',
        description: 'First-party Google indexing status, organic impressions, CTR, and search queries.',
        connected: false,
        required_permission: 'OAuth 2.0 (webmasters.readonly scope)',
        data_available: ['Real organic click and impression counts', 'Actual average rank positions', 'Google index coverage status'],
      },
      {
        id: 'analytics_4',
        provider: 'analytics_4',
        name: 'Google Analytics 4',
        description: 'Session traffic, landing page bounce rate, and organic conversion attribution.',
        connected: false,
        required_permission: 'OAuth 2.0 (analytics.readonly scope)',
        data_available: ['Organic landing page sessions', 'Engagement rates', 'E-commerce conversion events'],
      },
      {
        id: 'business_profile',
        provider: 'business_profile',
        name: 'Google Business Profile',
        description: 'Local search visibility, Google Maps views, and verified business phone/address signals.',
        connected: false,
        required_permission: 'OAuth 2.0 (business.manage scope)',
        data_available: ['Local pack appearance', 'Direction requests', 'Verified business NAP profile'],
      },
      {
        id: 'backlink_api',
        provider: 'backlink_api',
        name: 'Backlink Data Provider',
        description: 'External referring domain counts, domain authority, and follow/nofollow link graphs.',
        connected: false,
        required_permission: 'Ahrefs, Moz, or Semrush API key (or CSV manual upload)',
        data_available: ['Referring domains', 'Anchor distribution', 'Historical lost/gained links'],
      },
    ];

    for (const integ of defaultIntegrations) {
      this.integrations.set(integ.id, integ);
    }
  }

  // Projects
  getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  saveProject(project: Project) {
    this.projects.set(project.id, project);
  }

  // Audits
  getAudits(projectId?: string): Audit[] {
    const list = Array.from(this.audits.values());
    if (projectId) {
      return list.filter(a => a.project_id === projectId);
    }
    return list;
  }

  getAudit(id: string): Audit | undefined {
    return this.audits.get(id);
  }

  saveAudit(audit: Audit) {
    this.audits.set(audit.id, audit);
  }

  // Pages
  getPages(auditId: string): CrawledPage[] {
    return this.pages.get(auditId) || [];
  }

  savePages(auditId: string, pageList: CrawledPage[]) {
    this.pages.set(auditId, pageList);
  }

  // Issues
  getIssues(auditId: string): SEOIssue[] {
    return this.issues.get(auditId) || [];
  }

  saveIssues(auditId: string, issueList: SEOIssue[]) {
    this.issues.set(auditId, issueList);
  }

  updateIssueStatus(auditId: string, issueId: string, status: SEOIssue['status'], notes?: string) {
    const list = this.issues.get(auditId) || [];
    const item = list.find(i => i.id === issueId);
    if (item) {
      item.status = status;
      if (notes !== undefined) item.notes = notes;
    }
  }

  // Progress
  setProgress(auditId: string, progress: AuditCrawlProgress) {
    this.progressMap.set(auditId, progress);
  }

  getProgress(auditId: string): AuditCrawlProgress | undefined {
    return this.progressMap.get(auditId);
  }

  // Integrations
  getIntegrations(): IntegrationStatus[] {
    // Refresh Gemini status dynamically from env var
    const gemini = this.integrations.get('gemini');
    if (gemini) {
      gemini.connected = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    }
    return Array.from(this.integrations.values());
  }
}

export const store = new InMemoryStore();

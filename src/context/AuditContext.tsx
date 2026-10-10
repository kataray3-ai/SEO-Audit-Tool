import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Audit,
  CrawledPage,
  SEOIssue,
  Project,
  IssueStatus,
  CrawlConfiguration,
} from '../types/seo';

interface AuditContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentAudit: Audit | null;
  currentPages: CrawledPage[];
  currentIssues: SEOIssue[];
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  isDemoMode: boolean;
  toggleDemoMode: (val?: boolean) => void;
  isLoading: boolean;
  error: string | null;
  activeAuditId: string | null;
  setActiveAuditId: (id: string | null) => void;
  refreshAuditData: (auditId?: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: IssueStatus, notes?: string) => Promise<void>;
  startAudit: (config: CrawlConfiguration) => Promise<string>;
  launchQuickAudit: (rawUrl: string) => Promise<string>;
  switchAudit: (auditId: string) => Promise<void>;
}

const AuditContext = createContext<AuditContextType | null>(null);

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj_apexgear_demo');
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [currentPages, setCurrentPages] = useState<CrawledPage[]>([]);
  const [currentIssues, setCurrentIssues] = useState<SEOIssue[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

  // Load projects on startup
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          const defaultProj = data[0];
          setActiveProjectId(defaultProj.id);
          if (defaultProj.last_audit_id) {
            await loadAudit(defaultProj.last_audit_id);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAudit = async (auditId: string) => {
    setError(null);
    try {
      const [auditRes, pagesRes, issuesRes] = await Promise.all([
        fetch(`/api/audits/${auditId}`),
        fetch(`/api/audits/${auditId}/pages`),
        fetch(`/api/audits/${auditId}/issues`),
      ]);

      if (!auditRes.ok) throw new Error('Failed to fetch audit data');

      const auditData: Audit = await auditRes.json();
      const pagesData: CrawledPage[] = pagesRes.ok ? await pagesRes.json() : [];
      const issuesData: SEOIssue[] = issuesRes.ok ? await issuesRes.json() : [];

      setCurrentAudit(auditData);
      setCurrentPages(pagesData);
      setCurrentIssues(issuesData);
      setIsDemoMode(Boolean(auditData.is_demo));
      setActiveProjectId(auditData.project_id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refreshAuditData = async (auditId?: string) => {
    const id = auditId || currentAudit?.id;
    if (id) {
      await loadAudit(id);
    }
    await fetchProjects();
  };

  const switchAudit = async (auditId: string) => {
    await loadAudit(auditId);
  };

  const updateIssueStatus = async (issueId: string, status: IssueStatus, notes?: string) => {
    if (!currentAudit) return;
    try {
      const res = await fetch(`/api/audits/${currentAudit.id}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        setCurrentIssues(prev =>
          prev.map(i => (i.id === issueId ? { ...i, status, notes: notes ?? i.notes } : i))
        );
      }
    } catch (err) {
      console.error('Failed to update issue status', err);
    }
  };

  const startAudit = async (config: CrawlConfiguration): Promise<string> => {
    setError(null);
    let cleanUrl = config.url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Clear old activeAuditId while creating new one to prevent stale polling
    setActiveAuditId(null);

    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        url: cleanUrl,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to start audit');
    }

    const data = await res.json();
    setActiveAuditId(data.audit_id);
    if (data.project_id) {
      setActiveProjectId(data.project_id);
    }
    setIsDemoMode(false);
    await fetchProjects();
    return data.audit_id;
  };

  const launchQuickAudit = async (rawUrl: string): Promise<string> => {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let hostname = 'Website';
    try {
      hostname = new URL(cleanUrl).hostname;
    } catch {}

    const quickConfig: CrawlConfiguration = {
      url: cleanUrl,
      project_name: hostname,
      website_type: 'ecommerce',
      target_country: 'United States',
      target_language: 'en-US',
      primary_market: 'Global',
      website_platform: 'Custom',
      target_keywords: [],
      competitor_urls: [],
      crawl_source: 'both',
      max_pages: 15,
      crawl_depth: 3,
      same_domain_only: true,
      respect_robots_txt: true,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
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
    };

    setActiveTab('new_audit');
    return await startAudit(quickConfig);
  };

  const toggleDemoMode = (val?: boolean) => {
    const nextVal = val !== undefined ? val : !isDemoMode;
    setIsDemoMode(nextVal);
    if (nextVal) {
      loadAudit('audit_demo_recent');
    }
  };

  return (
    <AuditContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentAudit,
        currentPages,
        currentIssues,
        projects,
        activeProjectId,
        setActiveProjectId,
        isDemoMode,
        toggleDemoMode,
        isLoading,
        error,
        activeAuditId,
        setActiveAuditId,
        refreshAuditData,
        updateIssueStatus,
        startAudit,
        launchQuickAudit,
        switchAudit,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) throw new Error('useAudit must be used within an AuditProvider');
  return context;
};

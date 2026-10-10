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
  refreshAuditData: (auditId?: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: IssueStatus, notes?: string) => Promise<void>;
  startAudit: (config: CrawlConfiguration) => Promise<string>;
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
    setIsLoading(true);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuditData = async (auditId?: string) => {
    const id = auditId || currentAudit?.id;
    if (id) {
      await loadAudit(id);
    }
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
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          project_id: activeProjectId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to start audit');
      }

      const data = await res.json();
      setIsDemoMode(false);
      return data.audit_id;
    } finally {
      setIsLoading(false);
    }
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
        refreshAuditData,
        updateIssueStatus,
        startAudit,
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

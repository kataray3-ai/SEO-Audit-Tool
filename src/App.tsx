import React from 'react';
import { AuditProvider, useAudit } from './context/AuditContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { NewAuditView } from './views/NewAuditView';
import { AuditHistoryView } from './views/AuditHistoryView';
import { TechnicalSeoView } from './views/TechnicalSeoView';
import { OnPageSeoView } from './views/OnPageSeoView';
import { ContentAuditView } from './views/ContentAuditView';
import { PerformanceView } from './views/PerformanceView';
import { InternalLinksView } from './views/InternalLinksView';
import { SchemaAuditView } from './views/SchemaAuditView';
import { BacklinksView } from './views/BacklinksView';
import { LocalSeoView } from './views/LocalSeoView';
import { CompetitorAnalysisView } from './views/CompetitorAnalysisView';
import { KeywordOpportunitiesView } from './views/KeywordOpportunitiesView';
import { AiRecommendationsView } from './views/AiRecommendationsView';
import { ReportsView } from './views/ReportsView';
import { IntegrationsView } from './views/IntegrationsView';
import { SettingsView } from './views/SettingsView';
import { RotateCw, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, isLoading, error } = useAudit();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <RotateCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading audit intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl max-w-md text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">Application Error</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'new_audit':
        return <NewAuditView />;
      case 'history':
        return <AuditHistoryView />;
      case 'technical':
        return <TechnicalSeoView />;
      case 'onpage':
        return <OnPageSeoView />;
      case 'content':
        return <ContentAuditView />;
      case 'performance':
        return <PerformanceView />;
      case 'internal_links':
        return <InternalLinksView />;
      case 'schema':
        return <SchemaAuditView />;
      case 'backlinks':
        return <BacklinksView />;
      case 'local_seo':
        return <LocalSeoView />;
      case 'competitors':
        return <CompetitorAnalysisView />;
      case 'keywords':
        return <KeywordOpportunitiesView />;
      case 'ai_recommendations':
        return <AiRecommendationsView />;
      case 'reports':
        return <ReportsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      {renderView()}
    </main>
  );
};

export default function App() {
  return (
    <AuditProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-300 selection:text-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <MainContent />
        </div>
      </div>
    </AuditProvider>
  );
}

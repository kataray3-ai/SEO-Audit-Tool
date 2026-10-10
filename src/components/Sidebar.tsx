import React from 'react';
import { useAudit } from '../context/AuditContext';
import {
  LayoutDashboard,
  PlayCircle,
  History,
  ShieldCheck,
  FileCode,
  FileText,
  Gauge,
  Network,
  Binary,
  Link2,
  MapPin,
  Users,
  Search,
  Sparkles,
  Printer,
  Boxes,
  Settings,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentAudit, currentIssues } = useAudit();

  const criticalHighCount = currentIssues.filter(
    i => i.severity === 'critical' || i.severity === 'high'
  ).length;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'new_audit', label: 'Start New Audit', icon: PlayCircle },
    { id: 'history', label: 'Audit History', icon: History },
    {
      id: 'technical',
      label: 'Technical SEO',
      icon: ShieldCheck,
      badge: currentIssues.filter(i => i.category === 'technical').length || undefined,
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'onpage',
      label: 'On-Page SEO',
      icon: FileCode,
      badge: currentIssues.filter(i => i.category === 'onpage').length || undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'content',
      label: 'Content Audit',
      icon: FileText,
      badge: currentIssues.filter(i => i.category === 'content').length || undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'internal_links', label: 'Internal Links', icon: Network },
    { id: 'schema', label: 'Schema Audit', icon: Binary },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
    { id: 'local_seo', label: 'Local SEO', icon: MapPin },
    { id: 'competitors', label: 'Competitor Analysis', icon: Users },
    { id: 'keywords', label: 'Keyword Opportunities', icon: Search },
    {
      id: 'ai_recommendations',
      label: 'AI Recommendations',
      icon: Sparkles,
      badge: currentAudit?.top_recommendations?.length || 'AI',
      badgeColor: 'bg-amber-400 text-slate-900 font-bold',
    },
    { id: 'reports', label: 'Reports & Export', icon: Printer },
    { id: 'integrations', label: 'Integrations', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto z-20 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-slate-900 shadow-xs text-sm">
            SEO
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              SEO Audit Pro
              <span className="text-[10px] uppercase font-bold bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded-sm">
                AI
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
              {currentAudit?.project_name || 'Enterprise Engine'}
            </div>
          </div>
        </div>
      </div>

      {/* Critical alerts banner if issues exist */}
      {criticalHighCount > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-600 shrink-0" />
          <div className="text-xs text-red-800 font-medium">
            <span className="font-bold">{criticalHighCount}</span> critical & high issues
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="p-2.5 space-y-0.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-slate-950 font-semibold border-l-3 border-amber-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ml-1.5 ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Crawler Engine
          </span>
          <span className="text-slate-600 font-semibold">Ready</span>
        </div>
        <div className="text-slate-400 truncate text-[10px]">
          Target: {currentAudit?.root_url || 'No domain selected'}
        </div>
      </div>
    </aside>
  );
};

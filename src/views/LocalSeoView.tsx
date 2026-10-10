import React from 'react';
import { useAudit } from '../context/AuditContext';
import {
  MapPin,
  Phone,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';

export const LocalSeoView: React.FC = () => {
  const { currentAudit, currentPages } = useAudit();

  const hasLocalSchema = currentPages.some(p =>
    p.schemas.some(s => s.type.toLowerCase().includes('localbusiness') || s.type.toLowerCase().includes('store'))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Local SEO & Geographic Signals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            NAP (Name, Address, Phone) consistency, LocalBusiness schema, location pages, and Google Business Profile readiness.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
          Target Market: <span className="text-amber-600 ml-1">{currentAudit?.crawl_configuration.target_country || 'US'}</span>
        </div>
      </div>

      {/* Local SEO Status Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Local Schema</span>
            <Building className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900">
            {hasLocalSchema ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> LocalBusiness Detected
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Missing Local Schema
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            LocalBusiness or Store JSON-LD helps Google Maps connect your website with physical locations.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">NAP Consistency</span>
            <Phone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-slate-900">
            Phone & Address in Footer
          </div>
          <p className="text-[11px] text-slate-500">
            Contact information must exactly match citation listings and Google Business Profile.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Google Business Profile</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-slate-700">
            OAuth Integration Ready
          </div>
          <p className="text-[11px] text-slate-500">
            Connect Google Business Profile API in Settings &gt; Integrations to sync store hours and reviews.
          </p>
        </div>
      </div>

      {/* Local SEO Implementation Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Local Search Optimization Checklist</h3>
        <div className="space-y-3 text-xs">
          {[
            {
              title: 'Embed Google Map on Contact or Store Locator Page',
              status: 'recommended',
              desc: 'Include an accessible Google Maps iframe or link directly to your verified place profile.',
            },
            {
              title: 'Implement LocalBusiness JSON-LD with geo-coordinates',
              status: hasLocalSchema ? 'passed' : 'action_needed',
              desc: 'Include latitude, longitude, telephone, address, and openingHoursSpecification.',
            },
            {
              title: 'Geo-targeted Title & Meta Description tags',
              status: 'recommended',
              desc: 'Include primary city and state/region in the homepage or dedicated local landing page titles.',
            },
            {
              title: 'Consistent NAP in Sitewide Footer',
              status: 'passed',
              desc: 'Ensure physical street address and telephone are indexable HTML (not embedded in an image).',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
            >
              <div>
                <h4 className="font-bold text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                  item.status === 'passed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.status === 'action_needed'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {item.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

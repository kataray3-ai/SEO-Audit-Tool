import { PerformanceAuditData, PageSpeedMetric } from '../src/types/seo.js';
import { safeFetch } from './ssrf.js';

export async function fetchPageSpeedData(
  targetUrl: string,
  strategy: 'mobile' | 'desktop'
): Promise<PerformanceAuditData | null> {
  const apiKey = process.env.PAGESPEED_API_KEY || '';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    targetUrl
  )}&strategy=${strategy}&category=performance${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const res = await safeFetch(apiUrl, { timeoutMs: 15000, maxBytes: 5 * 1024 * 1024 });
    if (res.statusCode !== 200) {
      return null;
    }

    const data = JSON.parse(res.body);
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) return null;

    const score = Math.round((lighthouse.categories?.performance?.score || 0) * 100);
    const audits = lighthouse.audits || {};

    const formatMetric = (auditKey: string, unit = 's', thresholdGood = '2.5s', thresholdPoor = '4.0s'): PageSpeedMetric => {
      const audit = audits[auditKey];
      if (!audit) {
        return { value: 0, unit, status: 'unavailable', threshold_good: thresholdGood, threshold_poor: thresholdPoor };
      }
      const val = parseFloat((audit.numericValue ? audit.numericValue / 1000 : 0).toFixed(2));
      const scoreNum = audit.score || 0;
      const status = scoreNum >= 0.9 ? 'good' : scoreNum >= 0.5 ? 'needs_improvement' : 'poor';
      return {
        value: val,
        unit,
        status,
        threshold_good: thresholdGood,
        threshold_poor: thresholdPoor,
      };
    };

    // Opportunities
    const opportunities: PerformanceAuditData['opportunities'] = [];
    const oppKeys = [
      'render-blocking-resources',
      'unused-javascript',
      'unused-css-rules',
      'modern-image-formats',
      'uses-responsive-images',
      'efficient-animated-content',
    ];

    for (const key of oppKeys) {
      const a = audits[key];
      if (a && a.score !== null && a.score < 0.9) {
        opportunities.push({
          title: a.title || key,
          description: a.description?.split('[')[0]?.trim() || '',
          estimated_savings_ms: a.details?.overallSavingsMs,
          estimated_savings_bytes: a.details?.overallSavingsBytes,
        });
      }
    }

    return {
      url: targetUrl,
      device: strategy,
      score,
      has_field_data: Boolean(data.loadingExperience?.metrics),
      field_metrics: data.loadingExperience?.metrics
        ? {
            lcp: {
              value: parseFloat(((data.loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile || 0) / 1000).toFixed(2)),
              unit: 's',
              status:
                (data.loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS?.category || '') === 'FAST'
                  ? 'good'
                  : 'needs_improvement',
              threshold_good: '<= 2.5s',
              threshold_poor: '> 4.0s',
            },
            cls: {
              value: parseFloat(((data.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || 0) / 100).toFixed(2)),
              unit: '',
              status:
                (data.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category || '') === 'FAST'
                  ? 'good'
                  : 'needs_improvement',
              threshold_good: '<= 0.1',
              threshold_poor: '> 0.25',
            },
          }
        : undefined,
      lab_metrics: {
        lcp: formatMetric('largest-contentful-paint', 's', '<= 2.5s', '> 4.0s'),
        cls: formatMetric('cumulative-layout-shift', '', '<= 0.1', '> 0.25'),
        fcp: formatMetric('first-contentful-paint', 's', '<= 1.8s', '> 3.0s'),
        speed_index: formatMetric('speed-index', 's', '<= 3.4s', '> 5.8s'),
        total_blocking_time: {
          value: Math.round(audits['total-blocking-time']?.numericValue || 0),
          unit: 'ms',
          status: (audits['total-blocking-time']?.score || 0) >= 0.9 ? 'good' : 'poor',
          threshold_good: '<= 200ms',
          threshold_poor: '> 600ms',
        },
      },
      opportunities,
      diagnostics: [
        {
          title: 'DOM Size',
          description: 'Avoid an excessive DOM size to reduce memory usage and rendering cost.',
          value: audits['dom-size']?.displayValue,
        },
        {
          title: 'Critical Request Chains',
          description: 'Minimize chain length and payload sizes for above-the-fold assets.',
          value: audits['critical-request-chains']?.displayValue,
        },
      ],
      collected_at: new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

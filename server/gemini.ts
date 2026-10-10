import { GoogleGenAI, Type } from '@google/genai';
import { SEOIssue, AIRecommendation, CrawlConfiguration, CrawledPage } from '../src/types/seo.js';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function generateAIRecommendations(
  issues: SEOIssue[],
  pages: CrawledPage[],
  config: CrawlConfiguration
): Promise<AIRecommendation[]> {
  const criticalAndHighIssues = issues.filter(
    i => i.severity === 'critical' || i.severity === 'high' || i.severity === 'medium'
  );

  // If no issues found or very clean site
  if (criticalAndHighIssues.length === 0) {
    return [
      {
        recommendation_id: 'rec_clean_1',
        issue_title: 'Maintain current SEO hygiene and monitor Core Web Vitals',
        affected_urls: [config.url],
        category: 'technical',
        severity: 'informational',
        evidence: 'No critical or high-severity issues were discovered during the crawl.',
        explanation: 'Your crawled pages demonstrate sound adherence to foundational technical and on-page standards.',
        potential_business_impact: 'Sustained indexability and crawl efficiency across major search engines.',
        recommended_action: 'Schedule recurring monthly audits and monitor Google Search Console indexing reports.',
        implementation_steps: [
          'Set a calendar reminder for routine technical health checks.',
          'Review Google Search Console for any coverage or mobile usability anomalies.',
        ],
        estimated_effort: 'Quick win (<30m)',
        priority_score: 3,
        confidence: 'High',
        verification_steps: ['Verify Google Search Console crawl stats remain steady.'],
      },
    ];
  }

  const ai = getAiClient();

  if (ai) {
    try {
      // Summarize top issues for prompt
      const issuesSummary = criticalAndHighIssues.slice(0, 8).map(i => ({
        rule_id: i.rule_id,
        title: i.title,
        severity: i.severity,
        category: i.category,
        page_url: i.page_url || config.url,
        evidence: i.evidence,
        description: i.description,
      }));

      const prompt = `You are a Principal SEO Technical Architect and Generative AI Strategist.
Analyze the following verified audit findings for website: ${config.url} (${config.website_type} in ${config.target_country}).

Audit Findings:
${JSON.stringify(issuesSummary, null, 2)}

Provide up to 5 prioritized, high-impact SEO recommendations.
Every recommendation must directly reference the verified findings and evidence.
Provide realistic code examples (such as correct HTML head tags, JSON-LD, robots.txt, or redirect rules).
Do not make exaggerated ranking guarantees. Include beginner and technical implementation steps.`;

      const apiPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of prioritized actionable SEO recommendations',
            items: {
              type: Type.OBJECT,
              properties: {
                recommendation_id: { type: Type.STRING },
                issue_title: { type: Type.STRING },
                affected_urls: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                category: {
                  type: Type.STRING,
                  enum: ['technical', 'onpage', 'content', 'performance', 'links', 'schema', 'mobile', 'security'],
                },
                severity: {
                  type: Type.STRING,
                  enum: ['critical', 'high', 'medium', 'low', 'informational'],
                },
                evidence: { type: Type.STRING },
                explanation: { type: Type.STRING },
                potential_business_impact: { type: Type.STRING },
                recommended_action: { type: Type.STRING },
                implementation_steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                code_example_or_rewrite: { type: Type.STRING },
                estimated_effort: {
                  type: Type.STRING,
                  enum: ['Quick win (<30m)', 'Moderate (1-3h)', 'High effort (3h+)'],
                },
                priority_score: { type: Type.INTEGER },
                confidence: {
                  type: Type.STRING,
                  enum: ['High', 'Medium', 'Low'],
                },
                verification_steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'recommendation_id',
                'issue_title',
                'affected_urls',
                'category',
                'severity',
                'evidence',
                'explanation',
                'potential_business_impact',
                'recommended_action',
                'implementation_steps',
                'estimated_effort',
                'priority_score',
                'confidence',
                'verification_steps',
              ],
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timed out after 6000ms')), 6000)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);

      const parsed = JSON.parse(response.text?.trim() || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as AIRecommendation[];
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to deterministic recommendations:', err.message);
    }
  }

  // Deterministic fallback based on verified issues
  return criticalAndHighIssues.slice(0, 5).map((issue, idx) => {
    let effort: 'Quick win (<30m)' | 'Moderate (1-3h)' | 'High effort (3h+)' = 'Quick win (<30m)';
    let codeExample: string | undefined;

    if (issue.rule_id.includes('title')) {
      codeExample = `<title>Target Keyword & Value Prop | ${config.project_name || 'Brand'}</title>`;
    } else if (issue.rule_id.includes('canonical')) {
      codeExample = `<link rel="canonical" href="${issue.page_url || config.url}" />`;
    } else if (issue.rule_id.includes('meta_desc')) {
      codeExample = `<meta name="description" content="Engaging 140-character summary highlighting your primary products, USPs, and a clear call to action." />`;
    } else if (issue.rule_id.includes('robots')) {
      codeExample = `User-agent: *\nDisallow: /admin/\nDisallow: /checkout/\n\nSitemap: ${config.url}/sitemap.xml`;
    } else if (issue.rule_id.includes('schema')) {
      codeExample = `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "${config.project_name || 'My Website'}",\n  "url": "${config.url}"\n}\n</script>`;
      effort = 'Moderate (1-3h)';
    }

    return {
      recommendation_id: `rec_det_${idx + 1}`,
      issue_title: issue.title,
      affected_urls: issue.page_url ? [issue.page_url] : [config.url],
      category: issue.category,
      severity: issue.severity,
      evidence: issue.evidence,
      explanation: issue.description,
      potential_business_impact:
        issue.severity === 'critical'
          ? 'Prevents severe indexation blocks and preserves organic click eligibility.'
          : 'Improves snippet CTR and crawl budget efficiency.',
      recommended_action: issue.recommendation,
      implementation_steps: [
        'Review the affected template or CMS page editor.',
        'Apply the recommended fix following the snippet provided.',
        'Validate the live response headers and HTML using developer tools.',
        'Request re-indexing in Google Search Console.',
      ],
      code_example_or_rewrite: codeExample,
      estimated_effort: effort,
      priority_score: issue.severity === 'critical' ? 9 : issue.severity === 'high' ? 8 : 6,
      confidence: 'High',
      verification_steps: [
        'Inspect page source in browser to ensure changes rendered correctly.',
        'Re-run an audit to confirm the rule test passes.',
      ],
    };
  });
}

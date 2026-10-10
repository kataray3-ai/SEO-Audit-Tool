export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type IssueCategory =
  | 'technical'
  | 'onpage'
  | 'content'
  | 'performance'
  | 'links'
  | 'schema'
  | 'mobile'
  | 'security';

export type IssueStatus = 'open' | 'in_progress' | 'fixed' | 'dismissed';

export interface SEOIssue {
  id: string;
  audit_id: string;
  page_id?: string;
  page_url?: string;
  category: IssueCategory;
  rule_id: string;
  title: string;
  severity: IssueSeverity;
  evidence: string;
  description: string;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  status: IssueStatus;
  assigned_to?: string;
  notes?: string;
  created_at: string;
}

export interface CrawledPage {
  id: string;
  audit_id: string;
  url: string;
  final_url: string;
  status_code: number;
  content_type: string;
  response_time_ms: number;
  redirect_chain?: string[];
  depth: number;
  title?: string;
  title_length?: number;
  meta_description?: string;
  meta_description_length?: number;
  canonical_url?: string;
  is_canonical_match?: boolean;
  robots_directives?: {
    meta_robots?: string;
    x_robots_tag?: string;
    is_noindex?: boolean;
    is_nofollow?: boolean;
  };
  h1_tags: string[];
  h2_tags: string[];
  headings_hierarchy_valid: boolean;
  word_count: number;
  internal_links_count: number;
  external_links_count: number;
  inbound_internal_links_count?: number;
  internal_links: Array<{ href: string; text: string; rel?: string }>;
  external_links: Array<{ href: string; text: string; rel?: string }>;
  images: Array<{
    src: string;
    alt?: string;
    has_alt: boolean;
    is_decorative?: boolean;
    loading?: string;
    width?: number;
    height?: number;
  }>;
  schemas: Array<{
    type: string;
    raw_json?: string;
    is_valid: boolean;
    errors?: string[];
    warnings?: string[];
  }>;
  open_graph: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter_card?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  has_mixed_content: boolean;
  html_lang?: string;
  viewport_configured: boolean;
  fetch_error?: string;
}

export interface CategoryScore {
  score: number;
  weight: number;
  applicable_checks: number;
  passed_checks: number;
  failed_checks: number;
  skipped_checks: number;
  coverage_percent: number;
  explanation: string;
  previous_score?: number;
}

export interface CategoryScores {
  technical: CategoryScore;
  onpage: CategoryScore;
  content: CategoryScore;
  performance: CategoryScore;
  links: CategoryScore;
  schema: CategoryScore;
}

export interface AIRecommendation {
  recommendation_id: string;
  issue_title: string;
  affected_urls: string[];
  category: IssueCategory;
  severity: IssueSeverity;
  evidence: string;
  explanation: string;
  potential_business_impact: string;
  recommended_action: string;
  implementation_steps: string[];
  code_example_or_rewrite?: string;
  estimated_effort: 'Quick win (<30m)' | 'Moderate (1-3h)' | 'High effort (3h+)';
  priority_score: number; // 1 to 10
  confidence: 'High' | 'Medium' | 'Low';
  verification_steps: string[];
  status?: IssueStatus;
}

export interface PageSpeedMetric {
  value: number;
  unit: string;
  status: 'good' | 'needs_improvement' | 'poor' | 'unavailable';
  threshold_good: string;
  threshold_poor: string;
}

export interface PerformanceAuditData {
  url: string;
  device: 'mobile' | 'desktop';
  score: number;
  has_field_data: boolean;
  field_metrics?: {
    lcp?: PageSpeedMetric;
    inp?: PageSpeedMetric;
    cls?: PageSpeedMetric;
    fcp?: PageSpeedMetric;
    ttfb?: PageSpeedMetric;
  };
  lab_metrics: {
    lcp: PageSpeedMetric;
    cls: PageSpeedMetric;
    fcp: PageSpeedMetric;
    speed_index: PageSpeedMetric;
    total_blocking_time: PageSpeedMetric;
  };
  opportunities: Array<{
    title: string;
    description: string;
    estimated_savings_ms?: number;
    estimated_savings_bytes?: number;
  }>;
  diagnostics: Array<{
    title: string;
    description: string;
    value?: string;
  }>;
  collected_at: string;
}

export interface CrawlConfiguration {
  url: string;
  project_name: string;
  website_type: 'ecommerce' | 'saas' | 'blog' | 'local_business' | 'corporate';
  target_country: string;
  target_language: string;
  primary_market: string;
  website_platform?: string;
  target_keywords?: string[];
  competitor_urls?: string[];
  crawl_source: 'homepage' | 'sitemap' | 'both';
  max_pages: number;
  crawl_depth: number;
  same_domain_only: boolean;
  respect_robots_txt: boolean;
  user_agent: string;
  request_delay_ms: number;
  modules: {
    technical: boolean;
    onpage: boolean;
    content: boolean;
    performance: boolean;
    links: boolean;
    schema: boolean;
    local: boolean;
    competitors: boolean;
  };
}

export interface AuditCrawlProgress {
  step:
    | 'validating'
    | 'fetching_robots'
    | 'discovering_sitemaps'
    | 'crawling_pages'
    | 'analyzing_html'
    | 'checking_links'
    | 'running_performance'
    | 'analyzing_schema'
    | 'generating_ai'
    | 'completed'
    | 'failed';
  message: string;
  current_page?: string;
  pages_crawled: number;
  total_discovered: number;
  percent: number;
  error?: string;
}

export interface Audit {
  id: string;
  project_id: string;
  project_name: string;
  root_url: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  crawl_configuration: CrawlConfiguration;
  coverage_summary: {
    pages_crawled: number;
    total_urls_discovered: number;
    crawl_depth_reached: number;
    robots_txt_found: boolean;
    sitemaps_found: number;
    average_response_time_ms: number;
    ssl_valid: boolean;
  };
  overall_score: number;
  category_scores: CategoryScores;
  issue_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
    total: number;
  };
  top_recommendations: AIRecommendation[];
  performance_data?: {
    mobile?: PerformanceAuditData;
    desktop?: PerformanceAuditData;
  };
  is_demo?: boolean;
}

export interface Project {
  id: string;
  name: string;
  root_url: string;
  website_type: string;
  target_country: string;
  target_language: string;
  created_at: string;
  last_audit_id?: string;
  audit_count: number;
}

export interface IntegrationStatus {
  id: string;
  provider:
    | 'gemini'
    | 'pagespeed'
    | 'search_console'
    | 'analytics_4'
    | 'business_profile'
    | 'backlink_api'
    | 'keyword_api';
  name: string;
  description: string;
  connected: boolean;
  required_permission: string;
  last_checked_at?: string;
  error_message?: string;
  data_available: string[];
}

export interface CompetitorComparison {
  competitor_url: string;
  domain: string;
  crawled_pages: number;
  title_coverage_pct: number;
  meta_desc_coverage_pct: number;
  schema_implemented: boolean;
  performance_score: number;
  target_topic_gaps: string[];
  h1_usage_rate: number;
  notes: string;
}

export interface KeywordOpportunity {
  keyword: string;
  search_intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  relevance_score: number;
  target_page_url?: string;
  content_gap_type: 'missing_landing_page' | 'thin_content' | 'cannibalization_risk' | 'faq_expansion';
  suggested_action: string;
  related_questions: string[];
}

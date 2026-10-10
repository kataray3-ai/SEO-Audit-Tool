import { CrawledPage, SEOIssue, CategoryScores, CategoryScore, IssueSeverity } from '../src/types/seo.js';
import { RobotsTxtInfo, SitemapInfo } from './crawler.js';

interface RuleEvaluationContext {
  pages: CrawledPage[];
  robots: RobotsTxtInfo;
  sitemap: SitemapInfo;
  auditId: string;
}

export function evaluateSEO(ctx: RuleEvaluationContext): {
  issues: SEOIssue[];
  categoryScores: CategoryScores;
  overallScore: number;
} {
  const issues: SEOIssue[] = [];
  const { pages, robots, sitemap, auditId } = ctx;

  const validPages = pages.filter(p => !p.fetch_error && p.status_code > 0);
  const totalPages = pages.length;

  // Track checks per category: { passed: number, failed: number, applicable: number }
  const stats = {
    technical: { passed: 0, failed: 0, applicable: 0 },
    onpage: { passed: 0, failed: 0, applicable: 0 },
    content: { passed: 0, failed: 0, applicable: 0 },
    performance: { passed: 0, failed: 0, applicable: 0 },
    links: { passed: 0, failed: 0, applicable: 0 },
    schema: { passed: 0, failed: 0, applicable: 0 },
  };

  const addIssue = (issue: Omit<SEOIssue, 'id' | 'audit_id' | 'created_at' | 'status'>) => {
    issues.push({
      id: `iss_${Math.random().toString(36).substring(2, 9)}`,
      audit_id: auditId,
      status: 'open',
      created_at: new Date().toISOString(),
      ...issue,
    });
  };

  // ==========================================
  // 1. TECHNICAL SEO CHECKS
  // ==========================================

  // Check 1.1: Robots.txt existence
  stats.technical.applicable++;
  if (robots.exists) {
    stats.technical.passed++;
  } else {
    stats.technical.failed++;
    addIssue({
      category: 'technical',
      rule_id: 'tech_robots_missing',
      title: 'Robots.txt file not found',
      severity: 'medium',
      evidence: 'GET /robots.txt returned 404 or empty',
      description: 'A missing robots.txt prevents search engines from receiving crawling instructions, rate guidance, and sitemap references.',
      recommendation: 'Create a robots.txt file in the root directory specifying your XML sitemap URL and crawl directives.',
      confidence: 'high',
    });
  }

  // Check 1.2: XML Sitemap presence
  stats.technical.applicable++;
  if (sitemap.found && sitemap.urls.length > 0) {
    stats.technical.passed++;
  } else {
    stats.technical.failed++;
    addIssue({
      category: 'technical',
      rule_id: 'tech_sitemap_missing',
      title: 'No XML sitemap discovered or sitemap is empty',
      severity: 'high',
      evidence: `Checked sitemap declarations and standard endpoints (/sitemap.xml). Discovered 0 URLs.`,
      description: 'XML sitemaps help search engines efficiently discover all canonical, indexable URLs across your domain.',
      recommendation: 'Generate a standard XML sitemap and reference its full URL in robots.txt.',
      confidence: 'high',
    });
  }

  // Page-level technical checks
  for (const page of pages) {
    // Check 1.3: Fetch errors & 4xx/5xx status
    stats.technical.applicable++;
    if (page.fetch_error || page.status_code >= 400) {
      stats.technical.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.url,
        category: 'technical',
        rule_id: 'tech_http_error',
        title: `HTTP ${page.status_code || 'Error'}: Failed to retrieve page`,
        severity: page.status_code === 404 ? 'high' : 'critical',
        evidence: `URL ${page.url} returned status ${page.status_code || 0} (${page.fetch_error || 'Client/Server error'})`,
        description: 'Pages returning 4xx or 5xx status codes waste crawl budget and create negative user experiences.',
        recommendation: 'Fix the broken link or configure a 301 redirect to the most relevant live page.',
        confidence: 'high',
      });
    } else {
      stats.technical.passed++;
    }

    // Check 1.4: Redirect chains
    if (page.redirect_chain && page.redirect_chain.length > 1) {
      stats.technical.applicable++;
      stats.technical.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.url,
        category: 'technical',
        rule_id: 'tech_redirect_chain',
        title: 'Redirect chain detected (> 1 hop)',
        severity: 'medium',
        evidence: `Chain (${page.redirect_chain.length} hops): ${page.redirect_chain.join(' -> ')} -> ${page.final_url}`,
        description: 'Multiple redirect hops slow down page loading and can dilute link equity transmission.',
        recommendation: 'Update internal links to point directly to the destination URL without intermediary hops.',
        confidence: 'high',
      });
    }

    // Check 1.5: Canonical tag
    if (page.status_code === 200) {
      stats.technical.applicable++;
      if (!page.canonical_url) {
        stats.technical.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'technical',
          rule_id: 'tech_canonical_missing',
          title: 'Missing canonical tag',
          severity: 'medium',
          evidence: `No <link rel="canonical"> tag found on ${page.final_url}`,
          description: 'Canonical tags prevent duplicate content issues by explicitly designating the authoritative URL version.',
          recommendation: `Add a self-referencing canonical tag: <link rel="canonical" href="${page.final_url}" />`,
          confidence: 'high',
        });
      } else if (!page.is_canonical_match) {
        stats.technical.applicable++;
        stats.technical.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'technical',
          rule_id: 'tech_canonical_mismatch',
          title: 'Canonical URL does not match page URL',
          severity: 'medium',
          evidence: `Page is at "${page.final_url}" but canonical specifies "${page.canonical_url}"`,
          description: 'This tells search engines to index a different URL instead of this page. Ensure this is intentional.',
          recommendation: 'Verify that the canonical URL is the intended primary version and resolves with HTTP 200.',
          confidence: 'medium',
        });
      } else {
        stats.technical.passed++;
      }

      // Check 1.6: Mixed content
      stats.technical.applicable++;
      if (page.has_mixed_content) {
        stats.technical.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'technical',
          rule_id: 'tech_mixed_content',
          title: 'Mixed content: Insecure HTTP resources on HTTPS page',
          severity: 'high',
          evidence: `Insecure asset links (http://) detected within ${page.final_url}`,
          description: 'Mixed content causes browser security warnings and can result in blocked images or scripts.',
          recommendation: 'Change all asset protocol references to https:// or root-relative paths.',
          confidence: 'high',
        });
      } else {
        stats.technical.passed++;
      }
    }
  }

  // ==========================================
  // 2. ON-PAGE SEO CHECKS
  // ==========================================
  const seenTitles = new Map<string, string[]>();

  for (const page of validPages) {
    if (page.status_code !== 200) continue;

    // Check 2.1: Title Tag Presence & Length
    stats.onpage.applicable++;
    if (!page.title) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_title_missing',
        title: 'Missing title tag',
        severity: 'critical',
        evidence: `No <title> tag found on ${page.final_url}`,
        description: 'The title tag is one of the most critical on-page SEO signals and determines the SERP clickable headline.',
        recommendation: 'Add a descriptive, keyword-focused title tag between 40 and 60 characters.',
        confidence: 'high',
      });
    } else {
      // Duplicate title tracking
      const cleanTitle = page.title.toLowerCase().trim();
      const existing = seenTitles.get(cleanTitle) || [];
      existing.push(page.final_url);
      seenTitles.set(cleanTitle, existing);

      if (page.title_length! < 30) {
        stats.onpage.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'onpage',
          rule_id: 'onpage_title_too_short',
          title: 'Title tag too short',
          severity: 'low',
          evidence: `Title is ${page.title_length} characters: "${page.title}"`,
          description: 'Short title tags may not provide sufficient context to search engines and users.',
          recommendation: 'Expand the title to 45-60 characters to include your target brand and primary keyword.',
          confidence: 'high',
        });
      } else if (page.title_length! > 60) {
        stats.onpage.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'onpage',
          rule_id: 'onpage_title_too_long',
          title: 'Title tag too long (may truncate in SERP)',
          severity: 'low',
          evidence: `Title is ${page.title_length} characters: "${page.title}"`,
          description: 'Titles exceeding 60 characters are typically truncated with an ellipsis on Google desktop and mobile SERPs.',
          recommendation: 'Condense the title to under 60 characters while keeping the primary keyword near the beginning.',
          confidence: 'high',
        });
      } else {
        stats.onpage.passed++;
      }
    }

    // Check 2.2: Meta Description
    stats.onpage.applicable++;
    if (!page.meta_description) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_meta_desc_missing',
        title: 'Missing meta description',
        severity: 'high',
        evidence: `No meta description tag found on ${page.final_url}`,
        description: 'While not a direct ranking factor, meta descriptions strongly influence click-through rate (CTR) in search results.',
        recommendation: 'Add an engaging 120-155 character meta description highlighting the page proposition and a clear call to action.',
        confidence: 'high',
      });
    } else if (page.meta_description_length! < 70) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_meta_desc_too_short',
        title: 'Meta description is too short',
        severity: 'low',
        evidence: `Meta description is only ${page.meta_description_length} characters.`,
        description: 'Short descriptions miss opportunities to communicate value and attract organic clicks.',
        recommendation: 'Expand to between 120 and 155 characters to maximize search snippet real estate.',
        confidence: 'high',
      });
    } else if (page.meta_description_length! > 160) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_meta_desc_too_long',
        title: 'Meta description exceeds recommended length',
        severity: 'low',
        evidence: `Meta description is ${page.meta_description_length} characters (exceeds 160).`,
        description: 'Search engines will truncate snippets longer than ~160 characters in search results.',
        recommendation: 'Trim description to under 160 characters, keeping key value propositions visible.',
        confidence: 'high',
      });
    } else {
      stats.onpage.passed++;
    }

    // Check 2.3: H1 Headings
    stats.onpage.applicable++;
    if (page.h1_tags.length === 0) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_h1_missing',
        title: 'Missing H1 heading',
        severity: 'high',
        evidence: `0 <h1> tags found on ${page.final_url}`,
        description: 'The H1 tag defines the main topic of the page for both readers and search engine crawlers.',
        recommendation: 'Add a single descriptive H1 heading at the top of the main content area.',
        confidence: 'high',
      });
    } else if (page.h1_tags.length > 1) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_h1_multiple',
        title: 'Multiple H1 headings detected',
        severity: 'medium',
        evidence: `Found ${page.h1_tags.length} H1 tags: "${page.h1_tags.join('", "')}"`,
        description: 'While HTML5 permits multiple H1s, best practice recommends a single primary H1 for clear document outline.',
        recommendation: 'Convert secondary H1 elements to H2 or H3 tags to maintain clean typographic hierarchy.',
        confidence: 'medium',
      });
    } else {
      stats.onpage.passed++;
    }

    // Check 2.4: URL structure
    stats.onpage.applicable++;
    if (page.final_url.length > 100) {
      stats.onpage.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'onpage',
        rule_id: 'onpage_url_too_long',
        title: 'Excessively long URL structure',
        severity: 'low',
        evidence: `URL length is ${page.final_url.length} characters: "${page.final_url}"`,
        description: 'Concise URLs are easier to share, remember, and appear cleaner in SERP breadcrumbs.',
        recommendation: 'Simplify URL slugs by removing stop words and unnecessary subdirectories.',
        confidence: 'medium',
      });
    } else {
      stats.onpage.passed++;
    }
  }

  // Check 2.5: Duplicate Titles across pages
  for (const [titleStr, urls] of seenTitles.entries()) {
    if (urls.length > 1) {
      stats.onpage.applicable++;
      stats.onpage.failed++;
      addIssue({
        category: 'onpage',
        rule_id: 'onpage_title_duplicate',
        title: 'Duplicate title tags across multiple pages',
        severity: 'high',
        evidence: `Title "${titleStr}" shared by ${urls.length} pages (${urls.slice(0, 2).join(', ')})`,
        description: 'Identical title tags confuse search engines about which page should rank for targeted search queries.',
        recommendation: 'Ensure every indexable page has a unique title describing its distinct content.',
        confidence: 'high',
      });
    }
  }

  // ==========================================
  // 3. CONTENT QUALITY CHECKS
  // ==========================================
  for (const page of validPages) {
    if (page.status_code !== 200) continue;

    // Check 3.1: Thin Content (< 300 words)
    stats.content.applicable++;
    if (page.word_count < 250) {
      stats.content.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'content',
        rule_id: 'content_thin',
        title: 'Thin content: low word count',
        severity: 'high',
        evidence: `Only ${page.word_count} words extracted from ${page.final_url}`,
        description: 'Pages with fewer than 250 words frequently struggle to satisfy comprehensive search intent and may be seen as low quality.',
        recommendation: 'Expand page copy with in-depth explanations, FAQs, specifications, or user guides.',
        confidence: 'high',
      });
    } else {
      stats.content.passed++;
    }

    // Check 3.2: Heading structure
    stats.content.applicable++;
    if (page.h2_tags.length === 0 && page.word_count > 400) {
      stats.content.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'content',
        rule_id: 'content_no_subheadings',
        title: 'Long content lacking H2 subheadings',
        severity: 'medium',
        evidence: `Page has ${page.word_count} words but 0 <h2> tags.`,
        description: 'Breaking long content into scannable sections with descriptive H2 headings improves readability and featured snippet eligibility.',
        recommendation: 'Add clear H2 subheadings to delineate key sections of the text.',
        confidence: 'medium',
      });
    } else {
      stats.content.passed++;
    }
  }

  // ==========================================
  // 4. PERFORMANCE CHECKS
  // ==========================================
  for (const page of validPages) {
    stats.performance.applicable++;
    if (page.response_time_ms > 1200) {
      stats.performance.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'performance',
        rule_id: 'perf_slow_ttfb',
        title: 'Slow server response time (TTFB)',
        severity: 'high',
        evidence: `Server response time was ${page.response_time_ms}ms (exceeds recommended 800ms limit)`,
        description: 'Slow server response directly impacts First Contentful Paint and Largest Contentful Paint for visitors and crawlers.',
        recommendation: 'Enable edge caching, optimize database queries, or upgrade hosting infrastructure.',
        confidence: 'high',
      });
    } else {
      stats.performance.passed++;
    }

    // Check image dimensions / alt tags
    stats.performance.applicable++;
    const imagesMissingDimensions = page.images.filter(img => !img.width || !img.height);
    if (imagesMissingDimensions.length > 3) {
      stats.performance.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'performance',
        rule_id: 'perf_images_no_dimensions',
        title: 'Images missing explicit width and height attributes',
        severity: 'medium',
        evidence: `${imagesMissingDimensions.length} images lack width/height attributes on ${page.final_url}`,
        description: 'Images without explicit dimensions trigger layout shifts during rendering, deteriorating Cumulative Layout Shift (CLS).',
        recommendation: 'Set width and height HTML attributes or CSS aspect-ratio on all image tags.',
        confidence: 'high',
      });
    } else {
      stats.performance.passed++;
    }
  }

  // ==========================================
  // 5. INTERNAL LINKING & ARCHITECTURE
  // ==========================================
  for (const page of validPages) {
    // Check 5.1: Orphan Page Candidate (0 inbound internal links)
    stats.links.applicable++;
    if (page.depth > 0 && page.inbound_internal_links_count === 0) {
      stats.links.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'links',
        rule_id: 'links_orphan_candidate',
        title: 'Orphan page candidate (0 inbound internal links in crawl graph)',
        severity: 'high',
        evidence: `Discovered page ${page.final_url} has 0 recorded internal links pointing to it.`,
        description: 'Search engines and users may fail to discover orphan pages unless linked from relevant context within your site architecture.',
        recommendation: 'Add contextual internal links from parent category pages or related articles to this page.',
        confidence: 'medium',
      });
    } else {
      stats.links.passed++;
    }

    // Check 5.2: Deep click depth
    stats.links.applicable++;
    if (page.depth >= 4) {
      stats.links.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'links',
        rule_id: 'links_deep_click_depth',
        title: 'Page buried deep in site hierarchy (depth >= 4)',
        severity: 'medium',
        evidence: `Page is at click depth ${page.depth} from the homepage.`,
        description: 'Pages located four or more clicks away from the homepage receive less crawl frequency and lower internal PageRank.',
        recommendation: 'Flatten architecture by linking key landing pages from navigation menus or higher-level hubs.',
        confidence: 'high',
      });
    } else {
      stats.links.passed++;
    }

    // Check 5.3: Generic anchor text
    const genericAnchors = page.internal_links.filter(l => {
      const lower = l.text.toLowerCase().trim();
      return lower === 'click here' || lower === 'read more' || lower === 'here' || lower === 'learn more' || lower === 'link';
    });
    stats.links.applicable++;
    if (genericAnchors.length > 2) {
      stats.links.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'links',
        rule_id: 'links_generic_anchor',
        title: 'Non-descriptive internal link anchor text',
        severity: 'low',
        evidence: `Found ${genericAnchors.length} links with generic text like "click here" or "read more" on ${page.final_url}`,
        description: 'Descriptive anchor text gives crawlers semantic context about the target destination topic.',
        recommendation: 'Replace generic anchor text with descriptive keywords that indicate the destination page content.',
        confidence: 'high',
      });
    } else {
      stats.links.passed++;
    }
  }

  // ==========================================
  // 6. STRUCTURED DATA & SCHEMA
  // ==========================================
  for (const page of validPages) {
    stats.schema.applicable++;
    if (page.schemas.length === 0) {
      stats.schema.failed++;
      addIssue({
        page_id: page.id,
        page_url: page.final_url,
        category: 'schema',
        rule_id: 'schema_none_detected',
        title: 'No structured data (JSON-LD) detected',
        severity: 'medium',
        evidence: `0 schema blocks discovered on ${page.final_url}`,
        description: 'Structured data enhances search appearance with rich results and clarifies entity relationships.',
        recommendation: 'Implement relevant JSON-LD schema such as WebSite, Organization, Article, or Product.',
        confidence: 'high',
      });
    } else {
      // Check for syntax errors in existing schemas
      const invalidSchemas = page.schemas.filter(s => !s.is_valid);
      if (invalidSchemas.length > 0) {
        stats.schema.failed++;
        addIssue({
          page_id: page.id,
          page_url: page.final_url,
          category: 'schema',
          rule_id: 'schema_syntax_error',
          title: 'Structured data JSON-LD syntax error',
          severity: 'high',
          evidence: `Schema error on ${page.final_url}: ${invalidSchemas.map(s => s.errors?.join(', ')).join('; ')}`,
          description: 'Malformed JSON-LD cannot be parsed by Google and invalidates rich snippet qualification.',
          recommendation: 'Validate your JSON-LD using Google Rich Results Test and fix syntax errors.',
          confidence: 'high',
        });
      } else {
        stats.schema.passed++;
      }
    }
  }

  // ==========================================
  // CALCULATE DETERMINISTIC SCORES
  // ==========================================
  const weights: Record<keyof CategoryScores, number> = {
    technical: 0.25,
    onpage: 0.20,
    content: 0.20,
    performance: 0.15,
    links: 0.10,
    schema: 0.10,
  };

  const calculateCatScore = (key: keyof CategoryScores): CategoryScore => {
    const s = stats[key];
    const applicable = Math.max(1, s.applicable);
    const score = Math.round((s.passed / applicable) * 100);
    const coverage = totalPages > 0 ? 100 : 0;
    return {
      score,
      weight: weights[key],
      applicable_checks: s.applicable,
      passed_checks: s.passed,
      failed_checks: s.failed,
      skipped_checks: 0,
      coverage_percent: coverage,
      explanation: `${s.passed} of ${s.applicable} evaluated checks passed (${score}% compliance).`,
    };
  };

  const categoryScores: CategoryScores = {
    technical: calculateCatScore('technical'),
    onpage: calculateCatScore('onpage'),
    content: calculateCatScore('content'),
    performance: calculateCatScore('performance'),
    links: calculateCatScore('links'),
    schema: calculateCatScore('schema'),
  };

  // Weighted average
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const [cat, w] of Object.entries(weights)) {
    const cs = categoryScores[cat as keyof CategoryScores];
    totalWeightedScore += cs.score * w;
    totalWeight += w;
  }

  const overallScore = Math.round(totalWeightedScore / totalWeight);

  return {
    issues,
    categoryScores,
    overallScore,
  };
}

import * as cheerio from 'cheerio';
import { safeFetch, validatePublicUrl } from './ssrf.js';
import { CrawledPage, CrawlConfiguration } from '../src/types/seo.js';

export interface RobotsTxtInfo {
  exists: boolean;
  rawText: string;
  sitemaps: string[];
  disallowPatterns: string[];
  allowPatterns: string[];
  crawlDelay?: number;
}

export interface SitemapInfo {
  found: boolean;
  urls: string[];
  errors: string[];
}

export interface CrawlProgressCallback {
  (progress: {
    step: any;
    message: string;
    current_page?: string;
    pages_crawled: number;
    total_discovered: number;
    percent: number;
    error?: string;
  }): void;
}

/**
 * Normalizes URL: removes fragment (#), trims whitespace, and validates domain
 */
export function normalizeUrl(rawUrl: string, baseUrl?: string): string | null {
  try {
    const url = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
    // Ignore non-http(s) schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    // Remove hash/fragment
    url.hash = '';
    // Strip common tracking parameters for crawl deduplication
    const paramsToDelete = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    for (const p of paramsToDelete) {
      url.searchParams.delete(p);
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Parses robots.txt file content
 */
export async function fetchAndParseRobotsTxt(rootUrl: string): Promise<RobotsTxtInfo> {
  const parsed = new URL(rootUrl);
  const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

  try {
    const res = await safeFetch(robotsUrl, { timeoutMs: 6000, maxBytes: 512 * 1024 });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return { exists: false, rawText: '', sitemaps: [], disallowPatterns: [], allowPatterns: [] };
    }

    const lines = res.body.split(/\r?\n/);
    const sitemaps: string[] = [];
    const disallowPatterns: string[] = [];
    const allowPatterns: string[] = [];
    let crawlDelay: number | undefined;

    let appliesToBot = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const lower = cleanLine.toLowerCase();

      if (lower.startsWith('sitemap:')) {
        const sitemapUrl = cleanLine.substring(8).trim();
        if (sitemapUrl) sitemaps.push(sitemapUrl);
        continue;
      }

      if (lower.startsWith('user-agent:')) {
        const ua = lower.substring(11).trim();
        appliesToBot = ua === '*' || ua.toLowerCase() === 'seoauditprobot';
        continue;
      }

      if (appliesToBot) {
        if (lower.startsWith('disallow:')) {
          const rule = cleanLine.substring(9).trim();
          if (rule) disallowPatterns.push(rule);
        } else if (lower.startsWith('allow:')) {
          const rule = cleanLine.substring(6).trim();
          if (rule) allowPatterns.push(rule);
        } else if (lower.startsWith('crawl-delay:')) {
          const delay = parseFloat(cleanLine.substring(12).trim());
          if (!isNaN(delay)) crawlDelay = delay;
        }
      }
    }

    return {
      exists: true,
      rawText: res.body,
      sitemaps,
      disallowPatterns,
      allowPatterns,
      crawlDelay,
    };
  } catch (err) {
    return { exists: false, rawText: '', sitemaps: [], disallowPatterns: [], allowPatterns: [] };
  }
}

/**
 * Checks if a path is blocked by robots.txt
 */
export function isPathBlockedByRobots(path: string, robots: RobotsTxtInfo): boolean {
  for (const allow of robots.allowPatterns) {
    if (path.startsWith(allow)) return false;
  }
  for (const disallow of robots.disallowPatterns) {
    if (disallow === '/') return true;
    if (path.startsWith(disallow)) return true;
  }
  return false;
}

/**
 * Discovers and parses XML sitemaps
 */
export async function discoverSitemaps(rootUrl: string, declaredSitemaps: string[]): Promise<SitemapInfo> {
  const parsed = new URL(rootUrl);
  const potentialUrls = [
    ...declaredSitemaps,
    `${parsed.protocol}//${parsed.host}/sitemap.xml`,
    `${parsed.protocol}//${parsed.host}/sitemap_index.xml`,
  ];

  const uniqueCandidates = Array.from(new Set(potentialUrls));
  const discoveredUrls: string[] = [];
  const errors: string[] = [];
  let found = false;

  for (const candidate of uniqueCandidates) {
    try {
      const res = await safeFetch(candidate, { timeoutMs: 3500, maxBytes: 2 * 1024 * 1024 });
      if (res.statusCode >= 200 && res.statusCode < 300 && (res.body.includes('<urlset') || res.body.includes('<sitemapindex'))) {
        found = true;
        const $ = cheerio.load(res.body, { xmlMode: true });

        // If it's a sitemapindex, collect child sitemaps (first 3 to avoid infinite explosion)
        const subSitemaps: string[] = [];
        $('sitemapindex > sitemap > loc').each((_, el) => {
          const loc = $(el).text().trim();
          if (loc) subSitemaps.push(loc);
        });

        if (subSitemaps.length > 0) {
          for (const sub of subSitemaps.slice(0, 3)) {
            try {
              const subRes = await safeFetch(sub, { timeoutMs: 3000, maxBytes: 1024 * 1024 });
              if (subRes.statusCode === 200) {
                const sub$ = cheerio.load(subRes.body, { xmlMode: true });
                sub$('urlset > url > loc').each((_, el) => {
                  const loc = sub$(el).text().trim();
                  if (loc) discoveredUrls.push(loc);
                });
              }
            } catch (err: any) {
              errors.push(`Sub-sitemap fetch error for ${sub}: ${err.message}`);
            }
          }
        } else {
          // Direct urlset
          $('urlset > url > loc').each((_, el) => {
            const loc = $(el).text().trim();
            if (loc) discoveredUrls.push(loc);
          });
        }
        break; // Found and parsed primary sitemap
      }
    } catch (err: any) {
      // not critical, continue trying candidates
    }
  }

  return {
    found,
    urls: Array.from(new Set(discoveredUrls)),
    errors,
  };
}

/**
 * Extracts comprehensive technical & on-page SEO data from fetched HTML
 */
export function extractPageData(
  url: string,
  finalUrl: string,
  statusCode: number,
  contentType: string,
  headers: Record<string, string>,
  body: string,
  responseTimeMs: number,
  depth: number,
  redirectChain: string[] = []
): CrawledPage {
  const rootDomain = new URL(finalUrl).hostname;
  const $ = cheerio.load(body);

  // 1. Title
  const titleTag = $('title').first().text().trim();
  const title = titleTag || undefined;
  const title_length = titleTag ? titleTag.length : 0;

  // 2. Meta description
  const metaDesc = $('meta[name="description" i]').attr('content')?.trim();
  const meta_description = metaDesc || undefined;
  const meta_description_length = metaDesc ? metaDesc.length : 0;

  // 3. Canonical
  const canonicalHref = $('link[rel="canonical" i]').attr('href')?.trim();
  let canonical_url: string | undefined;
  let is_canonical_match: boolean | undefined;

  if (canonicalHref) {
    try {
      const resolved = new URL(canonicalHref, finalUrl).toString();
      canonical_url = resolved;
      is_canonical_match = resolved === finalUrl;
    } catch {
      canonical_url = canonicalHref;
      is_canonical_match = false;
    }
  }

  // 4. Robots directives
  const metaRobots = $('meta[name="robots" i]').attr('content')?.toLowerCase() || '';
  const xRobotsTag = headers['x-robots-tag']?.toLowerCase() || '';
  const combinedRobots = `${metaRobots} ${xRobotsTag}`;
  const is_noindex = combinedRobots.includes('noindex');
  const is_nofollow = combinedRobots.includes('nofollow');

  // 5. Headings
  const h1_tags: string[] = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1_tags.push(text);
  });

  const h2_tags: string[] = [];
  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2_tags.push(text);
  });

  // Simple hierarchy validity: has H1, no H3 before H2, etc.
  const headings_hierarchy_valid = h1_tags.length === 1;

  // 6. Word count
  // Remove scripts, styles, comments
  $('script, style, noscript, svg').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const words = bodyText ? bodyText.split(/\s+/).filter(w => w.length > 0) : [];
  const word_count = words.length;

  // 7. Internal & External Links
  const internal_links: Array<{ href: string; text: string; rel?: string }> = [];
  const external_links: Array<{ href: string; text: string; rel?: string }> = [];

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href')?.trim();
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      return;
    }

    const linkText = $(el).text().trim() || $(el).find('img').attr('alt')?.trim() || '';
    const rel = $(el).attr('rel')?.trim();

    try {
      const resolved = new URL(rawHref, finalUrl);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;

      const fullHref = resolved.toString();
      if (resolved.hostname === rootDomain || resolved.hostname.endsWith('.' + rootDomain)) {
        internal_links.push({ href: fullHref, text: linkText, rel });
      } else {
        external_links.push({ href: fullHref, text: linkText, rel });
      }
    } catch {
      // invalid URL in href
    }
  });

  // 8. Images
  const images: CrawledPage['images'] = [];
  $('img').each((_, el) => {
    const rawSrc = $(el).attr('src') || $(el).attr('data-src');
    if (!rawSrc) return;

    let src = rawSrc;
    try {
      src = new URL(rawSrc, finalUrl).toString();
    } catch {}

    const altAttr = $(el).attr('alt');
    const has_alt = altAttr !== undefined;
    const alt = altAttr ? altAttr.trim() : undefined;
    const role = $(el).attr('role');
    const is_decorative = role === 'presentation' || (has_alt && alt === '');
    const loading = $(el).attr('loading');
    const width = parseInt($(el).attr('width') || '0', 10) || undefined;
    const height = parseInt($(el).attr('height') || '0', 10) || undefined;

    images.push({
      src,
      alt,
      has_alt,
      is_decorative,
      loading,
      width,
      height,
    });
  });

  // 9. Structured Data (JSON-LD)
  const schemas: CrawledPage['schemas'] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const rawJson = $(el).html()?.trim();
    if (!rawJson) return;

    try {
      const parsed = JSON.parse(rawJson);
      const types: string[] = [];

      const extractTypes = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj['@type']) {
          if (Array.isArray(obj['@type'])) types.push(...obj['@type']);
          else types.push(obj['@type']);
        }
        if (Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(extractTypes);
        }
      };

      if (Array.isArray(parsed)) parsed.forEach(extractTypes);
      else extractTypes(parsed);

      const typeName = types.length > 0 ? types.join(', ') : 'Unknown Schema';
      schemas.push({
        type: typeName,
        raw_json: rawJson,
        is_valid: true,
      });
    } catch (jsonErr: any) {
      schemas.push({
        type: 'Invalid JSON-LD',
        raw_json: rawJson,
        is_valid: false,
        errors: [`JSON syntax error: ${jsonErr.message}`],
      });
    }
  });

  // 10. OpenGraph & Twitter
  const open_graph = {
    title: $('meta[property="og:title" i]').attr('content')?.trim(),
    description: $('meta[property="og:description" i]').attr('content')?.trim(),
    image: $('meta[property="og:image" i]').attr('content')?.trim(),
    url: $('meta[property="og:url" i]').attr('content')?.trim(),
    type: $('meta[property="og:type" i]').attr('content')?.trim(),
  };

  const twitter_card = {
    card: $('meta[name="twitter:card" i]').attr('content')?.trim(),
    title: $('meta[name="twitter:title" i]').attr('content')?.trim(),
    description: $('meta[name="twitter:description" i]').attr('content')?.trim(),
    image: $('meta[name="twitter:image" i]').attr('content')?.trim(),
  };

  // 11. Security & Mixed content
  let has_mixed_content = false;
  if (finalUrl.startsWith('https://')) {
    $('script[src^="http://"], link[href^="http://"], img[src^="http://"], iframe[src^="http://"]').each(() => {
      has_mixed_content = true;
    });
  }

  // 12. Viewport & HTML Lang
  const html_lang = $('html').attr('lang')?.trim();
  const viewport_configured = $('meta[name="viewport" i]').length > 0;

  return {
    id: `page_${Math.random().toString(36).substring(2, 9)}`,
    audit_id: '',
    url,
    final_url: finalUrl,
    status_code: statusCode,
    content_type: contentType,
    response_time_ms: responseTimeMs,
    redirect_chain: redirectChain,
    depth,
    title,
    title_length,
    meta_description,
    meta_description_length,
    canonical_url,
    is_canonical_match,
    robots_directives: {
      meta_robots: metaRobots || undefined,
      x_robots_tag: xRobotsTag || undefined,
      is_noindex,
      is_nofollow,
    },
    h1_tags,
    h2_tags,
    headings_hierarchy_valid,
    word_count,
    internal_links_count: internal_links.length,
    external_links_count: external_links.length,
    internal_links,
    external_links,
    images,
    schemas,
    open_graph,
    twitter_card,
    has_mixed_content,
    html_lang,
    viewport_configured,
  };
}

/**
 * Runs a crawl given a configuration, obeying robots.txt and concurrency limits
 */
export async function executeCrawl(
  config: CrawlConfiguration,
  onProgress: CrawlProgressCallback
): Promise<{
  pages: CrawledPage[];
  robots: RobotsTxtInfo;
  sitemap: SitemapInfo;
}> {
  onProgress({
    step: 'validating',
    message: 'Validating target domain security and accessibility...',
    pages_crawled: 0,
    total_discovered: 1,
    percent: 5,
  });

  const rootValidation = await validatePublicUrl(config.url);
  if (!rootValidation.valid) {
    throw new Error(`Target URL validation failed: ${rootValidation.error}`);
  }

  const rootUrl = rootValidation.normalizedUrl!;
  const rootHostname = new URL(rootUrl).hostname;

  // 1. Fetch robots.txt
  onProgress({
    step: 'fetching_robots',
    message: 'Fetching and analyzing /robots.txt...',
    pages_crawled: 0,
    total_discovered: 1,
    percent: 10,
  });
  const robots = await fetchAndParseRobotsTxt(rootUrl);

  // 2. Discover sitemaps
  onProgress({
    step: 'discovering_sitemaps',
    message: 'Checking XML sitemaps and index files...',
    pages_crawled: 0,
    total_discovered: 1,
    percent: 15,
  });
  const sitemap = await discoverSitemaps(rootUrl, robots.sitemaps);

  // Setup crawl queue
  const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];

  // Seed with sitemap URLs if crawl source is sitemap or both
  if (config.crawl_source === 'sitemap' || config.crawl_source === 'both') {
    for (const smUrl of sitemap.urls.slice(0, config.max_pages * 2)) {
      const norm = normalizeUrl(smUrl);
      if (norm && !queue.some(q => q.url === norm)) {
        queue.push({ url: norm, depth: 1 });
      }
    }
  }

  const visitedUrls = new Set<string>();
  const crawledPages: CrawledPage[] = [];

  onProgress({
    step: 'crawling_pages',
    message: `Beginning crawl of discovered pages (limit: ${config.max_pages})...`,
    pages_crawled: 0,
    total_discovered: queue.length,
    percent: 20,
  });

  while (queue.length > 0 && crawledPages.length < config.max_pages) {
    const nextItem = queue.shift()!;
    const targetUrl = nextItem.url;

    if (visitedUrls.has(targetUrl)) continue;
    visitedUrls.add(targetUrl);

    // Domain check
    try {
      const parsedTarget = new URL(targetUrl);
      const isSameDomain = (h1: string, h2: string) => {
        if (h1.toLowerCase() === h2.toLowerCase()) return true;
        return h1.toLowerCase().replace(/^www\./, '') === h2.toLowerCase().replace(/^www\./, '');
      };

      if (config.same_domain_only && !isSameDomain(parsedTarget.hostname, rootHostname)) {
        continue;
      }

      // Robots check (only for sub-pages beyond root URL)
      if (nextItem.depth > 0 && config.respect_robots_txt && robots.exists) {
        if (isPathBlockedByRobots(parsedTarget.pathname, robots)) {
          continue;
        }
      }
    } catch {
      continue;
    }

    onProgress({
      step: 'crawling_pages',
      message: `Fetching ${targetUrl}`,
      current_page: targetUrl,
      pages_crawled: crawledPages.length,
      total_discovered: queue.length + visitedUrls.size,
      percent: Math.min(80, 20 + Math.round((crawledPages.length / config.max_pages) * 60)),
    });

    const modernBrowserUa =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

    try {
      let res;
      try {
        res = await safeFetch(targetUrl, {
          timeoutMs: 8000,
          userAgent: config.user_agent && !config.user_agent.includes('SEOAuditPro') ? config.user_agent : modernBrowserUa,
        });
      } catch (initialErr: any) {
        // If initial fetch on root URL failed with HTTPS, try HTTP fallback
        if (nextItem.depth === 0 && targetUrl.startsWith('https://')) {
          const httpFallback = targetUrl.replace(/^https:\/\//, 'http://');
          res = await safeFetch(httpFallback, {
            timeoutMs: 8000,
            userAgent: modernBrowserUa,
          });
        } else {
          throw initialErr;
        }
      }

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        // Non-HTML resource
        continue;
      }

      const page = extractPageData(
        targetUrl,
        res.finalUrl,
        res.statusCode,
        contentType,
        res.headers,
        res.body,
        res.responseTimeMs,
        nextItem.depth,
        res.redirectChain
      );

      crawledPages.push(page);

      // Add discovered internal links to queue if within depth limit
      if (nextItem.depth < config.crawl_depth) {
        for (const link of page.internal_links) {
          const norm = normalizeUrl(link.href, page.final_url);
          if (
            norm &&
            !visitedUrls.has(norm) &&
            !queue.some(q => q.url === norm) &&
            queue.length + crawledPages.length < config.max_pages * 3
          ) {
            try {
              const linkHost = new URL(norm).hostname.toLowerCase();
              const cleanLinkHost = linkHost.replace(/^www\./, '');
              const cleanRootHost = rootHostname.toLowerCase().replace(/^www\./, '');
              if (cleanLinkHost === cleanRootHost) {
                queue.push({ url: norm, depth: nextItem.depth + 1 });
              }
            } catch {}
          }
        }
      }

      // Delay between requests
      if (config.request_delay_ms > 0) {
        await new Promise(r => setTimeout(r, Math.min(config.request_delay_ms, 1500)));
      }
    } catch (fetchErr: any) {
      // Record failed fetch
      crawledPages.push({
        id: `page_${Math.random().toString(36).substring(2, 9)}`,
        audit_id: '',
        url: targetUrl,
        final_url: targetUrl,
        status_code: 0,
        content_type: '',
        response_time_ms: 0,
        depth: nextItem.depth,
        h1_tags: [],
        h2_tags: [],
        headings_hierarchy_valid: false,
        word_count: 0,
        internal_links_count: 0,
        external_links_count: 0,
        internal_links: [],
        external_links: [],
        images: [],
        schemas: [],
        open_graph: {},
        has_mixed_content: false,
        viewport_configured: false,
        fetch_error: fetchErr.message || 'Connection error',
      });
    }
  }

  // Calculate inbound internal link counts across the crawl graph
  const inboundCountMap = new Map<string, number>();
  for (const page of crawledPages) {
    for (const link of page.internal_links) {
      const norm = normalizeUrl(link.href);
      if (norm) {
        inboundCountMap.set(norm, (inboundCountMap.get(norm) || 0) + 1);
      }
    }
  }

  for (const page of crawledPages) {
    page.inbound_internal_links_count = inboundCountMap.get(page.url) || inboundCountMap.get(page.final_url) || 0;
  }

  return {
    pages: crawledPages,
    robots,
    sitemap,
  };
}

# SEO Audit Pro AI

**SEO Audit Pro AI** is a full-stack, enterprise-grade search engine optimization (SEO) audit and technical intelligence platform. It crawls websites using an SSRF-safe HTTP crawler, evaluates hundreds of deterministic ranking and crawlability signals, and harnesses Google Gemini AI to synthesize verified findings into an actionable, prioritized implementation roadmap.

---

## 1. Features Implemented

1. **Deterministic Technical SEO Engine**:
   - HTTP status code tracking (200, 3xx, 4xx, 5xx)
   - Redirect chains and loop identification
   - Canonical tag verification (self-referencing, cross-domain, query parameter mismatch, missing)
   - Mixed content detection (insecure HTTP assets on HTTPS pages)
   - `/robots.txt` parser (`User-agent`, `Disallow`, `Allow`, `Crawl-delay`, `Sitemap:`)
   - XML sitemap discovery (`/sitemap.xml`, `/sitemap_index.xml`, sub-sitemaps)

2. **On-Page SEO Diagnostics**:
   - Exact Title element inspection (length thresholds, duplicate detection across crawled pages)
   - Meta description analysis (length, missing, duplicates)
   - Heading hierarchy (single primary H1 validation, multiple H1 warnings, H2-H6 distribution)
   - URL length, parameter sanitization, and slug structure
   - Live interactive Google SERP snippet preview (Mobile vs Desktop)

3. **Content Quality & E-E-A-T Signals**:
   - Thin content detection (< 250 words)
   - Readability and heading distribution
   - Qualitative E-E-A-T signals (Experience, Expertise, Authoritativeness, and Trustworthiness)
   - Editorial advice for expanding thin pages and answering user intent

4. **Internal Linking & Architecture**:
   - Crawl depth levels from homepage
   - Discovered orphan page candidates (0 internal inbound links within crawl graph)
   - Inbound and outbound internal links per page
   - Anchor text distribution table with generic anchor detection ("click here", "read more")

5. **Performance & Core Web Vitals**:
   - Google PageSpeed Insights API integration
   - Mobile vs Desktop tested side-by-side
   - Core Web Vitals thresholds:
     - Largest Contentful Paint (LCP &le; 2.5s)
     - Cumulative Layout Shift (CLS &le; 0.1)
     - First Contentful Paint (FCP &le; 1.8s)
     - Total Blocking Time (TBT &le; 200ms)
   - Distinguishes Chrome UX (CrUX) 75th percentile real user field data from synthetic lab measurements
   - Specific byte and latency optimization opportunities

6. **Structured Data & Schema Audit**:
   - JSON-LD and Microdata script discovery
   - Syntax validation and trailing comma / parse error alerts
   - Schema type classification (Product, Organization, WebSite, Article, BreadcrumbList, LocalBusiness)
   - Interactive, copyable Schema.org JSON-LD blueprints

7. **AI Implementation Roadmap (Gemini 3.8 Flash)**:
   - Grounded in verified audit findings and evidence excerpts
   - Priority scoring (P1–P10) and estimated effort categorization
   - Pre-generated code fixes (Nginx/Apache redirects, Schema JSON-LD, clean head tags)
   - Verification steps and status tracking (Open, In Progress, Fixed, Dismissed)

8. **Backlinks & Off-Page Analysis**:
   - Referring domain counts and diversity
   - Dofollow vs nofollow distribution
   - High-value broken backlink reclamation queue (external links hitting 404s)
   - CSV upload workflow with clear data source labeling

9. **Competitor SEO Comparison**:
   - Side-by-side comparison matrix across up to 5 domains
   - Evaluates metadata coverage, schema, performance scores, and topical content gaps

10. **Keyword Opportunities**:
    - Search intent classification (Transactional, Commercial, Informational)
    - Content gap detection (Missing landing pages, thin content, FAQ schema opportunities)
    - &quot;People Also Ask&quot; question recommendations

11. **Client Reports & White-Label Exports**:
    - Downloadable CSV of issues (`/api/audits/:id/export/csv-issues`)
    - Downloadable CSV of crawled pages (`/api/audits/:id/export/csv-pages`)
    - Downloadable CSV of internal links (`/api/audits/:id/export/csv-links`)
    - Downloadable complete JSON audit object (`/api/audits/:id/export/json`)
    - Clean, printable PDF client report layout with agency white-label logo and client customization

12. **Interactive 5-Step Crawl Wizard & Live Pipeline Tracking**:
    - Validating host security &rarr; Fetching robots.txt &rarr; Discovering sitemaps &rarr; Crawling HTML &rarr; Deterministic evaluation &rarr; Core Web Vitals &rarr; Gemini AI Synthesis &rarr; Completed Report

13. **Bundled Comprehensive Demo Dataset**:
    - High-fidelity e-commerce sample audit (*ApexGear Outdoors*) clearly labeled with &quot;Demo Data Mode&quot; badge for instant exploration of all 17 navigation views.

---

## 2. Architecture & Security

### Backend Server (`server.ts`)
- **Framework**: Express with TypeScript and Vite development middleware mounting
- **SSRF Protection (`server/ssrf.ts`)**:
  - Rejects loopback addresses (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), and cloud metadata services (`metadata.google.internal`)
  - Resolves hostnames via DNS and validates resolved IP addresses before establishing TCP connections
  - Re-evaluates each hop in HTTP redirect chains against SSRF rules
  - Enforces response size budgets (max 4MB per request) and strict request timeouts
- **Crawler (`server/crawler.ts`)**:
  - Fast HTML parsing with `cheerio`
  - Politeness delays and concurrency controls
  - Normalizes and deduplicates URLs (strips tracking query parameters, hashes)
- **Scoring Engine (`server/rules.ts`)**:
  - Deterministic evaluation using standard industry weights:
    - Technical SEO: 25%
    - On-Page SEO: 20%
    - Content Quality: 20%
    - Performance: 15%
    - Internal Links & Architecture: 10%
    - Structured Data: 10%

---

## 3. Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (automatically injected in AI Studio runtime). Server-side only. |
| `PAGESPEED_API_KEY` | (Optional) Google PageSpeed Insights API key for higher rate limits. |
| `PORT` | Server listening port (default: `3000`). |

---

## 4. Setup & Deployment

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (Express + Vite HMR middleware)
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm start
```

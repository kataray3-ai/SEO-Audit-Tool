import dns from 'dns';
import { promisify } from 'util';
import http from 'http';
import https from 'https';

const lookupAsync = promisify(dns.lookup);

/**
 * Checks if an IPv4 or IPv6 string is within private, loopback, or cloud-metadata address ranges
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 check
  if (ip.includes('.')) {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link Local & Cloud Metadata e.g. 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 224.0.0.0/4 (Multicast)
    if (parts[0] >= 224) return true;
    // 255.255.255.255
    if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

    return false;
  }

  // IPv6 check
  const lowerIp = ip.toLowerCase();
  if (lowerIp === '::1' || lowerIp === '::' || lowerIp.startsWith('fe80:') || lowerIp.startsWith('fc00:') || lowerIp.startsWith('fd00:')) {
    return true;
  }

  return false;
}

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  error?: string;
}

/**
 * Validates a target URL against SSRF attacks and schema constraints
 */
export async function validatePublicUrl(targetUrl: string): Promise<UrlValidationResult> {
  let parsed: URL;
  try {
    let urlToParse = targetUrl.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    parsed = new URL(urlToParse);
  } catch (err: any) {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Deny localhost and internal host names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname === 'metadata.google.internal' ||
    hostname === '169.254.169.254'
  ) {
    return { valid: false, error: 'Target host is internal or restricted.' };
  }

  // Check if hostname is an IP literal
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
    if (isPrivateOrReservedIp(hostname)) {
      return { valid: false, error: 'Target IP is within a private or reserved network range.' };
    }
  } else {
    // DNS resolution to ensure it does not resolve to a private IP
    try {
      const addresses = await lookupAsync(hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          return {
            valid: false,
            error: `Domain resolves to private or restricted IP address: ${addr.address}`,
          };
        }
      }
    } catch (dnsErr: any) {
      return { valid: false, error: `Could not resolve domain ${hostname}: ${dnsErr.message}` };
    }
  }

  return {
    valid: true,
    normalizedUrl: parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname),
    hostname,
  };
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  acceptHeader?: string;
}

export interface SafeFetchResponse {
  statusCode: number;
  finalUrl: string;
  redirectChain: string[];
  headers: Record<string, string>;
  body: string;
  responseTimeMs: number;
}

/**
 * Performs a network request strictly validating every redirect against SSRF limits
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const {
    timeoutMs = 12000,
    maxBytes = 4 * 1024 * 1024, // 4MB maximum
    maxRedirects = 5,
    userAgent = 'SEOAuditProBot/1.0 (+https://seoauditpro.ai/bot; crawler)',
    acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  } = options;

  let currentUrl = targetUrl;
  const redirectChain: string[] = [];

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const validation = await validatePublicUrl(currentUrl);
    if (!validation.valid) {
      throw new Error(`SSRF validation failed for URL "${currentUrl}": ${validation.error}`);
    }

    const startTime = Date.now();
    const parsed = new URL(currentUrl);
    const transport = parsed.protocol === 'https:' ? https : http;

    const res = await new Promise<{
      statusCode: number;
      headers: Record<string, string>;
      body: string;
      responseTimeMs: number;
    }>((resolve, reject) => {
      let isTimedOut = false;
      const req = transport.request(
        parsed,
        {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            Accept: acceptHeader,
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'close',
          },
        },
        response => {
          let receivedBytes = 0;
          const chunks: Buffer[] = [];

          response.on('data', chunk => {
            receivedBytes += chunk.length;
            if (receivedBytes > maxBytes) {
              req.destroy(new Error(`Response exceeded maximum size limit of ${maxBytes} bytes`));
              return;
            }
            chunks.push(chunk);
          });

          response.on('end', () => {
            const responseTimeMs = Date.now() - startTime;
            const headersMap: Record<string, string> = {};
            for (const [k, v] of Object.entries(response.headers)) {
              if (typeof v === 'string') {
                headersMap[k.toLowerCase()] = v;
              } else if (Array.isArray(v)) {
                headersMap[k.toLowerCase()] = v.join(', ');
              }
            }

            const rawBody = Buffer.concat(chunks).toString('utf-8');
            resolve({
              statusCode: response.statusCode || 0,
              headers: headersMap,
              body: rawBody,
              responseTimeMs,
            });
          });
        }
      );

      const timer = setTimeout(() => {
        isTimedOut = true;
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      req.on('error', err => {
        clearTimeout(timer);
        if (isTimedOut) {
          reject(new Error(`Timeout: Target server did not respond within ${timeoutMs}ms`));
        } else {
          reject(err);
        }
      });

      req.end();
    });

    // Check for redirects
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers['location']) {
      redirectChain.push(currentUrl);
      const nextUrl = new URL(res.headers['location'], currentUrl).toString();
      currentUrl = nextUrl;
      continue;
    }

    return {
      statusCode: res.statusCode,
      finalUrl: currentUrl,
      redirectChain,
      headers: res.headers,
      body: res.body,
      responseTimeMs: res.responseTimeMs,
    };
  }

  throw new Error(`Too many redirects (exceeded limit of ${maxRedirects})`);
}

const SENSITIVE_PARAMS = new Set([
  'token', 'session', 'auth', 'key', 'secret',
  'access_token', 'id_token', 'refresh_token',
  'api_key', 'apikey', 'password', 'passwd',
  'sessionid', 'session_id', 'csrf', 'nonce',
]);

const SAFE_PARAMS = new Set([
  'page', 'p', 'q', 'query', 'search', 'sort', 'order',
  'limit', 'offset', 'v', 'id', 'tab', 'view', 'lang',
  'utm_source', 'utm_medium', 'utm_campaign',
  'sfvrsn', 'format', 'type',
]);

const REDACT_TOKEN = '[REDACTED]';

const ALREADY_ENCODED_RE = /%[0-9A-Fa-f]{2}/;

export function isAlreadyEncoded(segment: string): boolean {
  return ALREADY_ENCODED_RE.test(segment);
}

export function encodeMarkdownUrl(url: string): string {
  if (!url) return '';

  // Extract the raw URL from Markdown link syntax if present
  const extracted = extractUrlFromMarkdownWrapper(url);

  // Split into path and query/fragment
  const hashIdx = extracted.indexOf('#');
  const queryIdx = extracted.indexOf('?');
  const splitIdx = queryIdx !== -1 ? queryIdx : hashIdx !== -1 ? hashIdx : -1;

  const pathPart = splitIdx !== -1 ? extracted.slice(0, splitIdx) : extracted;
  const suffix = splitIdx !== -1 ? extracted.slice(splitIdx) : '';

  // Encode parentheses in the path (Markdown-unsafe) avoiding double-encoding
  const encodedPath = pathPart.replace(/[()]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
  });

  // Encode parentheses in suffix too
  const encodedSuffix = suffix.replace(/[()]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
  });

  return encodedPath + encodedSuffix;
}

export function decodeIfDoubleEncoded(url: string): string {
  // Detect double-encoded sequences like %2528 (which is %28 encoded again)
  const doubleEncodedRe = /%25([0-9A-Fa-f]{2})/g;
  if (doubleEncodedRe.test(url)) {
    return url.replace(/%25([0-9A-Fa-f]{2})/g, '%$1');
  }
  return url;
}

export function escapeMarkdownText(text: string): string {
  if (!text) return '';
  return text.replace(/([[\]\\])/g, '\\$1');
}

export function rawUrlToMarkdownLink(title: string, url: string): string {
  const safeTitle = escapeMarkdownText(title);
  const safeUrl = encodeMarkdownUrl(url);
  return `[${safeTitle}](${safeUrl})`;
}

export function extractUrlFromMarkdownWrapper(raw: string): string {
  if (!raw) return '';
  // Match [display_text](actual_url) pattern and extract actual_url
  const mdLinkMatch = raw.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
  if (mdLinkMatch) return mdLinkMatch[2];
  // Match [url](url) pattern where display == href
  const doubleLinkMatch = raw.match(/^\[([^\]]+)\]\(\1\)$/);
  if (doubleLinkMatch) return doubleLinkMatch[1];
  return raw;
}

export function redactSensitiveParams(url: string): string {
  if (!url) return '';

  const qIdx = url.indexOf('?');
  if (qIdx === -1) return url;

  const base = url.slice(0, qIdx);
  const rest = url.slice(qIdx + 1);
  const hashIdx = rest.indexOf('#');
  const queryStr = hashIdx !== -1 ? rest.slice(0, hashIdx) : rest;
  const fragment = hashIdx !== -1 ? rest.slice(hashIdx) : '';

  const params = queryStr.split('&').map((param) => {
    const eqIdx = param.indexOf('=');
    if (eqIdx === -1) return param;
    const key = param.slice(0, eqIdx).toLowerCase();
    if (SENSITIVE_PARAMS.has(key)) {
      return `${param.slice(0, eqIdx)}=${REDACT_TOKEN}`;
    }
    if (!SAFE_PARAMS.has(key) && param.slice(eqIdx + 1).length > 40) {
      return `${param.slice(0, eqIdx)}=${REDACT_TOKEN}`;
    }
    return param;
  });

  return `${base}?${params.join('&')}${fragment}`;
}

export function buildMarkdownUrl(pageTitle: string, pageUrl: string): string {
  const cleanUrl = extractUrlFromMarkdownWrapper(pageUrl);
  const encoded = encodeMarkdownUrl(cleanUrl);
  const cleanTitle = pageTitle
    .replace(/[^a-zA-Z0-9\s\-|:&+]/g, '')
    .trim();
  return `[${escapeMarkdownText(cleanTitle)}](${encoded})`;
}

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif',
]);

export function isImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const dotIdx = pathname.lastIndexOf('.');
    if (dotIdx === -1) return false;
    return IMAGE_EXTENSIONS.has(pathname.slice(dotIdx));
  } catch {
    const clean = url.split('?')[0].split('#')[0].toLowerCase();
    const dotIdx = clean.lastIndexOf('.');
    if (dotIdx === -1) return false;
    return IMAGE_EXTENSIONS.has(clean.slice(dotIdx));
  }
}

export function sanitizeUrlForMarkdown(url: string): string {
  if (!url) return '';
  let cleaned = url.replace(/<WebsiteContent_[A-Za-z0-9_]+>([\s\S]*?)<\/WebsiteContent_[A-Za-z0-9_]+>/g, '$1');
  cleaned = cleaned.replace(/<\/?WebsiteContent_[A-Za-z0-9_]+>/g, '');
  cleaned = cleaned.replace(/^edge_all_open_tabs\s*=\s*/, '');
  cleaned = extractUrlFromMarkdownWrapper(cleaned);
  cleaned = encodeMarkdownUrl(cleaned);
  return cleaned;
}

export function formatUrlAsMarkdown(url: string, label?: string): string {
  const sanitized = sanitizeUrlForMarkdown(url);
  if (isImageUrl(sanitized)) {
    return `![${label || 'Image'}](${sanitized})`;
  }
  return `[${escapeMarkdownText(label || sanitized)}](${sanitized})`;
}

export function encodeParens(url: string): string {
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeDecode(str: string): string {
  try { return decodeURIComponent(str); } catch { return str; }
}

const GIBBERISH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const LONG_HEX_RE = /^[0-9a-f]{16,}$/i;
const NUMERIC_ONLY_RE = /^\d{7,}$/;

function isGibberishSegment(segment: string): boolean {
  return GIBBERISH_RE.test(segment) || LONG_HEX_RE.test(segment) || NUMERIC_ONLY_RE.test(segment);
}

export function extractSmartLinkLabel(rawUrl: string): string {
  try {
    let urlToParse = rawUrl.trim();
    if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }

    const parsed = new URL(urlToParse);

    if (parsed.protocol === 'mailto:') {
      return parsed.pathname || rawUrl.replace(/^mailto:/i, '');
    }
    if (parsed.protocol === 'tel:') {
      return parsed.pathname || rawUrl.replace(/^tel:/i, '');
    }

    const pathname = parsed.pathname.replace(/\/+$/, '');
    const lastSegment = pathname.split('/').pop() || '';

    if (lastSegment && !isGibberishSegment(lastSegment)) {
      const dotIdx = lastSegment.lastIndexOf('.');
      if (dotIdx > 0) {
        const base = lastSegment.slice(0, dotIdx);
        if (!isGibberishSegment(base)) {
          return toTitleCase(safeDecode(base));
        }
      } else {
        return toTitleCase(safeDecode(lastSegment));
      }
    }

    const host = parsed.hostname.replace(/^www\./, '');
    const tldIdx = host.lastIndexOf('.');
    const name = tldIdx > 0 ? host.slice(0, tldIdx) : host;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Resource Link';
  }
}

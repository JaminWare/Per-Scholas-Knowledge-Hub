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

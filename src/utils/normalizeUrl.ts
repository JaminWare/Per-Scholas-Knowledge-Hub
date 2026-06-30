const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'si', 'feature', 'ref', 't', 'list',
]);

export function normalizeUrl(raw: string): string {
  let url = raw.trim().toLowerCase();

  // Strip protocol
  url = url.replace(/^https?:\/\//, '');

  // Strip www.
  url = url.replace(/^www\./, '');

  // Convert youtu.be short links to full youtube.com format
  const youtubeShortMatch = url.match(/^youtu\.be\/([a-zA-Z0-9_-]+)(.*)/);
  if (youtubeShortMatch) {
    url = `youtube.com/watch?v=${youtubeShortMatch[1]}${youtubeShortMatch[2]}`;
  }

  // Parse and strip tracking query parameters
  const qIndex = url.indexOf('?');
  if (qIndex !== -1) {
    const base = url.slice(0, qIndex);
    const queryString = url.slice(qIndex + 1);
    const params = queryString.split('&').filter((param) => {
      const key = param.split('=')[0];
      return !TRACKING_PARAMS.has(key);
    });
    url = params.length > 0 ? `${base}?${params.join('&')}` : base;
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  return url;
}

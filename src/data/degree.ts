export const isPhdDegree = (value: unknown = ''): boolean => {
  if (!value) return false;

  const degreeName = String(value).trim().toLowerCase();

  const phdPatterns = [
    /\bp\s*[.\-]?\s*h\s*[.\-]?\s*d\b/,
    /\bm\s*[.\-]?\s*phil\b/,
    /\bm\s*[.\-]?\s*d\b/,
    /\bd\s*[.\-]?\s*litt\b/,
    /\bdoctor\s+of\s+philosophy\b/,
  ];

  if (phdPatterns.some((pattern) => pattern.test(degreeName))) return true;

  const phdTokens = new Set(['phd', 'mphil', 'md', 'dlitt']);
  const tokens = degreeName
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return tokens.some((token) => phdTokens.has(token));
};

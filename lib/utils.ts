const ACRONYMS = new Set([
  'ai',
  'ui',
  'ux',
  'api',
  'html',
  'css',
  'js',
  'ts',
  'sql',
  'pdf',
  'url',
  'rss',
  'csv',
  'json',
  'xml',
  'http',
  'https',
  'www',
  'gdp',
  'cfo',
  'cto',
  'ceo',
]);

export function formatCategory(category: string): string {
  return category
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

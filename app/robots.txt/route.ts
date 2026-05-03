export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/ZepPellN/Aperture';

export async function GET() {
  const body = `# Aperture — LLM-compiled wiki
# https://github.com/ZepPellN/Aperture

# Allow all standard search engines
User-agent: *
Allow: /

# AI training crawlers — allow indexing for discoverability
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: BingPreview
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

# AI search crawlers — these power real-time AI search results
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: YouBot
Allow: /

# llms.txt standard — point AI agents to machine-readable index
User-agent: *
Allow: /llms.txt
Allow: /llms-zh.txt
Allow: /llms-full.txt
Allow: /llms-full-zh.txt
Allow: /api/wiki/

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

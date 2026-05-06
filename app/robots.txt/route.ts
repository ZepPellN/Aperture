export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aperture-daq.pages.dev';

export async function GET() {
  const body = `# Aperture — LLM-compiled wiki
# https://github.com/ZepPellN/Aperture

# Search & retrieval: allow
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# User-triggered: allow
User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Perplexity-User
Allow: /

# Training: block
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

# Opt-out tokens
User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

# Undeclared: block
User-agent: Bytespider
Disallow: /

User-agent: xAI-Grok
Disallow: /

# Standard search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Applebot
Allow: /

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

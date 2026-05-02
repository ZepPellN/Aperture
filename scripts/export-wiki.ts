import { spawnSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, dirname, join, resolve } from 'path';
import { filePathToSlug, getWikiDir, getWikiFiles } from '../lib/wiki-loader';

interface CliOptions {
  out?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' && argv[i + 1]) {
      options.out = argv[i + 1];
      i += 1;
    }
  }

  return options;
}

function countFiles(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count += 1;
    }
  }
  return count;
}

function defaultOutputPath(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return join(process.cwd(), 'exports', `wiki-snapshot-${stamp}.zip`);
}

function ensureZipAvailable() {
  const result = spawnSync('zip', ['-v'], { stdio: 'ignore' });
  if (result.status !== 0) {
    throw new Error('The `zip` command is required to export a wiki snapshot.');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const wikiDir = getWikiDir();
  if (!existsSync(wikiDir)) {
    throw new Error(`Wiki directory not found: ${wikiDir}`);
  }

  ensureZipAvailable();

  const outputPath = resolve(options.out || defaultOutputPath());
  mkdirSync(dirname(outputPath), { recursive: true });

  const stagingDir = mkdtempSync(join(tmpdir(), 'aperture-wiki-export-'));
  const stagingWikiDir = join(stagingDir, 'wiki');
  cpSync(wikiDir, stagingWikiDir, {
    recursive: true,
    filter: (source) => !basename(source).startsWith('.'),
  });

  const articleSlugs = getWikiFiles(wikiDir).map(filePathToSlug).sort();
  const manifest = {
    generated_at: new Date().toISOString(),
    source_wiki_dir: wikiDir,
    article_count: articleSlugs.length,
    file_count: countFiles(stagingWikiDir),
    articles: articleSlugs,
  };
  writeFileSync(join(stagingDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const zipResult = spawnSync('zip', ['-qr', outputPath, 'wiki', 'manifest.json'], {
    cwd: stagingDir,
    stdio: 'inherit',
  });

  if (zipResult.status !== 0) {
    throw new Error(`zip failed with status ${zipResult.status ?? 'unknown'}`);
  }

  const sizeMb = statSync(outputPath).size / 1024 / 1024;
  console.log(`Exported ${articleSlugs.length} wiki articles to ${outputPath}`);
  console.log(`Archive size: ${sizeMb.toFixed(2)} MB`);
  console.log(`Staging directory retained: ${stagingDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

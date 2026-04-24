import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface SemanticNeighbor {
  slug: string;
  score: number;
}

interface NeighborsData {
  [slug: string]: SemanticNeighbor[];
}

let cached: NeighborsData | null = null;

export function loadSemanticNeighbors(): NeighborsData {
  if (cached) return cached;

  const path = join(process.cwd(), 'lib', 'semantic-neighbors.json');
  if (!existsSync(path)) {
    cached = {};
    return cached;
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    cached = JSON.parse(raw) as NeighborsData;
    return cached;
  } catch {
    cached = {};
    return cached;
  }
}

export function getNeighborsFor(slug: string): SemanticNeighbor[] {
  const data = loadSemanticNeighbors();
  return data[slug] ?? [];
}

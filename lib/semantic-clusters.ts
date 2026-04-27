import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Cluster {
  id: number;
  centroidX: number;
  centroidY: number;
  members: string[];
}

interface ClustersData {
  clusters: Cluster[];
  unclustered: string[];
}

let cached: ClustersData | null = null;

export function loadClusters(): ClustersData {
  if (cached) return cached;

  const path = join(process.cwd(), 'lib', 'semantic-clusters.json');
  if (!existsSync(path)) {
    cached = { clusters: [], unclustered: [] };
    return cached;
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    cached = JSON.parse(raw) as ClustersData;
    return cached;
  } catch {
    cached = { clusters: [], unclustered: [] };
    return cached;
  }
}

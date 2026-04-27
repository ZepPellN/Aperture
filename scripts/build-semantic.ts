import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { UMAP } from 'umap-js';

const QMD_DB = process.env.QMD_INDEX || join(homedir(), '.cache', 'qmd', 'index.sqlite');
const LAYOUT_OUTPUT = join(process.cwd(), 'lib', 'semantic-layout.json');
const NEIGHBORS_OUTPUT = join(process.cwd(), 'lib', 'semantic-neighbors.json');
const CLUSTERS_OUTPUT = join(process.cwd(), 'lib', 'semantic-clusters.json');

interface SemanticLayout {
  [slug: string]: { x: number; y: number };
}

interface SemanticNeighbor {
  slug: string;
  score: number;
}

interface SemanticNeighbors {
  [slug: string]: SemanticNeighbor[];
}

interface Cluster {
  id: number;
  centroidX: number;
  centroidY: number;
  members: string[];
}

interface ClustersData {
  clusters: Cluster[];
  unclustered: string[];
}

interface DocEmbedding {
  slug: string;
  vector: Float32Array;
}

const VECTOR_DIM = 768;
const BYTES_PER_VEC = VECTOR_DIM * 4;

function normalizePath(path: string): string {
  // qmd path: wiki/category/article.md -> aperture slug: category/article
  return path.replace(/^wiki\//, '').replace(/\.md$/, '');
}

function l2Normalize(vec: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  for (let i = 0; i < vec.length; i++) {
    vec[i] /= norm;
  }
  return vec;
}

function meanPool(vectors: Float32Array[]): Float32Array {
  const result = new Float32Array(VECTOR_DIM);
  for (const vec of vectors) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      result[i] += vec[i];
    }
  }
  for (let i = 0; i < VECTOR_DIM; i++) {
    result[i] /= vectors.length;
  }
  return result;
}

function extractVector(
  chunkBlob: Buffer,
  chunkOffset: number
): Float32Array {
  const offset = chunkOffset * BYTES_PER_VEC;
  const vecBuf = chunkBlob.subarray(offset, offset + BYTES_PER_VEC);
  return new Float32Array(vecBuf.buffer, vecBuf.byteOffset, VECTOR_DIM);
}

function loadEmbeddings(): DocEmbedding[] {
  if (!existsSync(QMD_DB)) {
    console.warn(`[semantic] qmd DB not found at ${QMD_DB}, skipping.`);
    return [];
  }

  const db = new DatabaseSync(QMD_DB, { readOnly: true });

  // Verify expected tables exist
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('documents', 'content_vectors', 'vectors_vec_rowids', 'vectors_vec_vector_chunks00')"
    )
    .all() as { name: string }[];

  const required = new Set([
    'documents',
    'content_vectors',
    'vectors_vec_rowids',
    'vectors_vec_vector_chunks00',
  ]);
  for (const t of tables) required.delete(t.name);
  if (required.size > 0) {
    console.warn(
      `[semantic] Missing qmd tables: ${Array.from(required).join(', ')}, skipping.`
    );
    db.close();
    return [];
  }

  // 1. Get all active wiki documents
  const docs = db
    .prepare(
      "SELECT path, hash FROM documents WHERE collection = 'vault' AND path LIKE 'wiki/%' AND active = 1"
    )
    .all() as { path: string; hash: string }[];

  console.log(`[semantic] Found ${docs.length} wiki documents in qmd.`);

  if (docs.length === 0) {
    db.close();
    return [];
  }

  // Build hash -> slug map
  const hashToSlug = new Map<string, string>();
  for (const doc of docs) {
    hashToSlug.set(doc.hash, normalizePath(doc.path));
  }

  // 2. Get all chunk metadata for these hashes
  // Join content_vectors with vectors_vec_rowids to get chunk locations
  const chunks = db
    .prepare(
      `SELECT cv.hash, cv.seq, vr.chunk_id, vr.chunk_offset
       FROM content_vectors cv
       JOIN vectors_vec_rowids vr ON vr.id = cv.hash || '_' || cv.seq
       WHERE cv.hash IN (${docs.map(() => '?').join(',')})`
    )
    .all(...docs.map((d) => d.hash)) as {
    hash: string;
    seq: number;
    chunk_id: number;
    chunk_offset: number;
  }[];

  console.log(`[semantic] Found ${chunks.length} chunks to load.`);

  // 3. Group chunks by chunk_id so we read each chunk BLOB once
  const chunksById = new Map<number, { hash: string; offset: number }[]>();
  for (const c of chunks) {
    const list = chunksById.get(c.chunk_id) ?? [];
    list.push({ hash: c.hash, offset: c.chunk_offset });
    chunksById.set(c.chunk_id, list);
  }

  // 4. Read chunk BLOBs and extract vectors
  const vectorsByHash = new Map<string, Float32Array[]>();

  const chunkStmt = db.prepare(
    'SELECT rowid, vectors FROM vectors_vec_vector_chunks00 WHERE rowid = ?'
  );

  for (const [chunkId, items] of chunksById) {
    const row = chunkStmt.get(chunkId) as {
      rowid: number;
      vectors: Buffer;
    } | null;
    if (!row) {
      console.warn(`[semantic] Chunk ${chunkId} not found, skipping.`);
      continue;
    }
    for (const item of items) {
      const vec = extractVector(row.vectors, item.offset);
      const list = vectorsByHash.get(item.hash) ?? [];
      list.push(vec);
      vectorsByHash.set(item.hash, list);
    }
  }

  db.close();

  // 5. Mean-pool and normalize per document
  const embeddings: DocEmbedding[] = [];
  for (const [hash, slug] of hashToSlug) {
    const vecs = vectorsByHash.get(hash);
    if (!vecs || vecs.length === 0) {
      console.warn(`[semantic] No vectors for ${slug}, skipping.`);
      continue;
    }
    const pooled = meanPool(vecs);
    l2Normalize(pooled);
    embeddings.push({ slug, vector: pooled });
  }

  console.log(`[semantic] Produced ${embeddings.length} document embeddings.`);
  return embeddings;
}

function runUMAP(embeddings: DocEmbedding[]): SemanticLayout {
  if (embeddings.length < 3) {
    console.warn('[semantic] Too few embeddings for UMAP, skipping.');
    return {};
  }

  // Flatten vectors into a 2D array for umap-js
  const data: number[][] = [];
  for (const emb of embeddings) {
    const row: number[] = [];
    for (let i = 0; i < VECTOR_DIM; i++) row.push(emb.vector[i]);
    data.push(row);
  }

  console.log('[semantic] Running UMAP...');
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors: Math.min(15, embeddings.length - 1),
    minDist: 0.1,
    metric: 'euclidean',
  });

  const start = Date.now();
  const embedding = umap.fit(data);
  console.log(`[semantic] UMAP completed in ${Date.now() - start}ms.`);

  // Normalize UMAP output to [0, 100] range for consistency with existing graph coords
  const xs = embedding.map((p) => p[0]);
  const ys = embedding.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const layout: SemanticLayout = {};
  for (let i = 0; i < embeddings.length; i++) {
    const slug = embeddings[i].slug;
    const x = ((embedding[i][0] - minX) / rangeX) * 100;
    const y = ((embedding[i][1] - minY) / rangeY) * 100;
    layout[slug] = { x, y };
  }

  return layout;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

function computeNeighbors(embeddings: DocEmbedding[], topK = 5): SemanticNeighbors {
  const neighbors: SemanticNeighbors = {};
  const n = embeddings.length;

  for (let i = 0; i < n; i++) {
    const candidates: SemanticNeighbor[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const score = cosineSimilarity(embeddings[i].vector, embeddings[j].vector);
      candidates.push({ slug: embeddings[j].slug, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    neighbors[embeddings[i].slug] = candidates.slice(0, topK);
  }

  return neighbors;
}

function computeClusters(layout: SemanticLayout, eps = 12, minPoints = 3): ClustersData {
  const slugs = Object.keys(layout);
  const n = slugs.length;
  const visited = new Set<string>();
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];
  let clusterId = 0;

  function regionQuery(slug: string): string[] {
    const { x, y } = layout[slug];
    const neighbors: string[] = [];
    for (const other of slugs) {
      if (other === slug) continue;
      const dx = layout[other].x - x;
      const dy = layout[other].y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= eps) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  for (const slug of slugs) {
    if (visited.has(slug)) continue;
    visited.add(slug);

    const neighbors = regionQuery(slug);
    if (neighbors.length < minPoints) continue;

    // Start a new cluster
    const members = new Set<string>([slug, ...neighbors]);
    const queue = [...neighbors];

    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      if (visited.has(p)) continue;
      visited.add(p);

      const pNeighbors = regionQuery(p);
      if (pNeighbors.length >= minPoints) {
        for (const q of pNeighbors) {
          if (!members.has(q)) {
            members.add(q);
            queue.push(q);
          }
        }
      }
    }

    const memberList = Array.from(members);
    let sumX = 0;
    let sumY = 0;
    for (const m of memberList) {
      sumX += layout[m].x;
      sumY += layout[m].y;
    }

    clusters.push({
      id: clusterId++,
      centroidX: sumX / memberList.length,
      centroidY: sumY / memberList.length,
      members: memberList,
    });

    for (const m of memberList) {
      assigned.add(m);
    }
  }

  const unclustered = slugs.filter((s) => !assigned.has(s));
  return { clusters, unclustered };
}

function main() {
  console.log('[semantic] Starting semantic layout build...');

  const embeddings = loadEmbeddings();
  if (embeddings.length === 0) {
    console.log('[semantic] No embeddings loaded. Writing empty files.');
    writeFileSync(LAYOUT_OUTPUT, JSON.stringify({}, null, 2));
    writeFileSync(NEIGHBORS_OUTPUT, JSON.stringify({}, null, 2));
    writeFileSync(CLUSTERS_OUTPUT, JSON.stringify({ clusters: [], unclustered: [] }, null, 2));
    return;
  }

  const layout = runUMAP(embeddings);
  writeFileSync(LAYOUT_OUTPUT, JSON.stringify(layout, null, 2));
  console.log(`[semantic] Wrote ${Object.keys(layout).length} positions to ${LAYOUT_OUTPUT}`);

  console.log('[semantic] Computing semantic neighbors...');
  const neighbors = computeNeighbors(embeddings, 5);
  writeFileSync(NEIGHBORS_OUTPUT, JSON.stringify(neighbors, null, 2));
  console.log(`[semantic] Wrote ${Object.keys(neighbors).length} neighbor maps to ${NEIGHBORS_OUTPUT}`);

  console.log('[semantic] Computing semantic clusters...');
  const clusters = computeClusters(layout, 7, 4);
  writeFileSync(CLUSTERS_OUTPUT, JSON.stringify(clusters, null, 2));
  console.log(`[semantic] Wrote ${clusters.clusters.length} clusters (${clusters.unclustered.length} unclustered) to ${CLUSTERS_OUTPUT}`);
}

main();

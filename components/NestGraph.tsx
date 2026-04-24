'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import * as THREE from 'three';
import type { GraphData, GraphNode } from '@/lib/graph-builder';
import { formatCategory } from '@/lib/utils';

interface NestGraphProps {
  data: GraphData;
}

/* ------------------------------------------------------------------ */
/*  Global noise                                                       */
/* ------------------------------------------------------------------ */
const noise2D = createNoise2D();
const noise3D = createNoise3D();

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Node3D extends GraphNode {
  pos: [number, number, number];
  noiseSeed: number;
}

interface ClusterData {
  category: string;
  center: [number, number, number];
  color: string;
  nodes: Node3D[];
}

/* ------------------------------------------------------------------ */
/*  Layout: far apart category clusters                                */
/* ------------------------------------------------------------------ */
function useClusteredLayout(data: GraphData) {
  return useMemo(() => {
    const categories = [...new Set(data.nodes.map((n) => n.category))];
    const catCenters: Record<string, [number, number, number]> = {};

    categories.forEach((cat, i) => {
      const angle = (i / categories.length) * Math.PI * 2;
      const radius = 38 + noise2D(i * 0.5, 0) * 10;
      catCenters[cat] = [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        noise2D(i * 0.3, 100) * 10,
      ];
    });

    const nodes: Node3D[] = data.nodes.map((node) => {
      const center = catCenters[node.category];
      const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const localX = noise2D(hash * 0.1, node.category.length) * 4;
      const localY = noise2D(hash * 0.1, node.category.length + 50) * 4;
      const localZ = noise2D(hash * 0.1, node.category.length + 100) * 3;
      return {
        ...node,
        pos: [center[0] + localX, center[1] + localY, center[2] + localZ] as [
          number,
          number,
          number,
        ],
        noiseSeed: hash,
      };
    });

    const nodeMap = new Map<string, Node3D>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const clusters: ClusterData[] = categories.map((cat) => ({
      category: cat,
      center: catCenters[cat],
      color:
        nodes.find((n) => n.category === cat)?.color || '#9ca3af',
      nodes: nodes.filter((n) => n.category === cat),
    }));

    return { nodes, edges: data.edges, nodeMap, clusters };
  }, [data]);
}

function useAdjacency(data: GraphData): Record<string, Set<string>> {
  return useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const node of data.nodes) map[node.id] = new Set();
    for (const edge of data.edges) {
      map[edge.source]?.add(edge.target);
      map[edge.target]?.add(edge.source);
    }
    return map;
  }, [data]);
}

/* ------------------------------------------------------------------ */
/*  Seed shape — organic burst                                         */
/* ------------------------------------------------------------------ */
function SeedShape({
  node,
  isHovered,
  isSelected,
  isDimmed,
  onHover,
  onClick,
}: {
  node: Node3D;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onHover: (n: GraphNode | null) => void;
  onClick: (n: GraphNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const seed = node.noiseSeed;
  const size = 1 + node.size * 0.18;

  const geometry = useMemo(() => {
    const positions: number[] = [];

    function addRay(
      angleBase: number,
      length: number,
      segments: number,
      layerSeed: number
    ) {
      let px = 0, py = 0, pz = 0;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const r = t * length;
        const wobble = noise3D(t * 2.5, layerSeed, seed) * 0.6 * t;
        const angle = angleBase + wobble;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const z = noise3D(t * 3, seed, layerSeed) * 0.5 * t;
        positions.push(px, py, pz, x, y, z);
        px = x; py = y; pz = z;
      }
    }

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + noise2D(i * 0.35, seed) * 0.7;
      const len = size * (0.35 + Math.abs(noise2D(i * 0.45, seed + 10)) * 0.35);
      addRay(angle, len, 5, 0);
    }
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + noise2D(i * 0.28, seed + 50) * 1.0;
      const len = size * (0.7 + Math.abs(noise2D(i * 0.35, seed + 60)) * 0.9);
      addRay(angle, len, 8, 50);
    }
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + noise2D(i * 0.5, seed + 200) * 1.4;
      const len = size * (1.1 + Math.abs(noise2D(i * 0.4, seed + 210)) * 1.4);
      addRay(angle, len, 10, 200);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [seed, size]);

  useFrame(() => {
    if (groupRef.current) {
      const target = isHovered ? 1.7 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        0.1
      );
    }
  });

  const isActive = isHovered || isSelected;
  const opacity = isDimmed ? 0.1 : isActive ? 0.95 : 0.55;
  const coreOpacity = isDimmed ? 0.1 : isActive ? 1 : 0.7;

  return (
    <group
      ref={groupRef}
      position={node.pos}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(node);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(node);
      }}
    >
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={node.color} transparent opacity={opacity} />
      </lineSegments>
      <mesh>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isActive ? 1.4 : 0.35}
          transparent
          opacity={coreOpacity}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <torusGeometry args={[0.35, 0.02, 8, 24]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={1.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Growing arc edge (animates in on activation)                       */
/* ------------------------------------------------------------------ */
function GrowingArcEdge({
  source,
  target,
  color,
  isDimmed,
}: {
  source: [number, number, number];
  target: [number, number, number];
  color: string;
  isDimmed: boolean;
}) {
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const progressRef = useRef(0);

  const allPoints = useMemo(() => {
    const s = new THREE.Vector3(...source);
    const t = new THREE.Vector3(...target);
    const mid = new THREE.Vector3().addVectors(s, t).multiplyScalar(0.5);
    mid.z += s.distanceTo(t) * 0.3;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, t);
    return curve.getPoints(30);
  }, [source, target]);

  useEffect(() => {
    progressRef.current = 0;
    if (geoRef.current) {
      const flat = new Float32Array(allPoints.length * 3);
      allPoints.forEach((p, i) => {
        flat[i * 3] = p.x;
        flat[i * 3 + 1] = p.y;
        flat[i * 3 + 2] = p.z;
      });
      geoRef.current.setAttribute('position', new THREE.BufferAttribute(flat, 3));
      geoRef.current.setDrawRange(0, 0);
    }
  }, [allPoints]);

  useFrame(() => {
    progressRef.current = Math.min(1, progressRef.current + 0.025);
    if (geoRef.current) {
      const count = Math.max(2, Math.floor(allPoints.length * progressRef.current));
      geoRef.current.setDrawRange(0, count);
    }
  });

  return (
    <line>
      <bufferGeometry ref={geoRef} />
      <lineBasicMaterial
        color={color}
        transparent
        opacity={isDimmed ? 0.02 : 0.85}
        linewidth={2}
      />
    </line>
  );
}

/* ------------------------------------------------------------------ */
/*  Static arc edge (no animation)                                     */
/* ------------------------------------------------------------------ */
function StaticArcEdge({
  source,
  target,
  color,
  isActive,
  isDimmed,
}: {
  source: [number, number, number];
  target: [number, number, number];
  color: string;
  isActive: boolean;
  isDimmed: boolean;
}) {
  const points = useMemo(() => {
    const s = new THREE.Vector3(...source);
    const t = new THREE.Vector3(...target);
    const mid = new THREE.Vector3().addVectors(s, t).multiplyScalar(0.5);
    mid.z += s.distanceTo(t) * 0.3;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, t);
    return curve.getPoints(20).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [source, target]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={isActive ? 2 : 0.6}
      transparent
      opacity={isDimmed ? 0.02 : isActive ? 0.5 : 0.08}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Cluster: one territory with label, halo, and seeds                 */
/* ------------------------------------------------------------------ */
function Cluster({
  cluster,
  isHovered,
  isDimmed,
  onHoverCluster,
  hoveredNode,
  setHoveredNode,
  onNodeClick,
  activeNodeId,
  neighborIds,
  growingEdges,
  selectedNodeId,
}: {
  cluster: ClusterData;
  isHovered: boolean;
  isDimmed: boolean;
  onHoverCluster: (cat: string | null) => void;
  hoveredNode: GraphNode | null;
  setHoveredNode: (n: GraphNode | null) => void;
  onNodeClick: (n: GraphNode) => void;
  activeNodeId: string | null;
  neighborIds: Set<string>;
  growingEdges: Set<string>;
  selectedNodeId: string | null;
}) {
  const { category, center, color, nodes } = cluster;

  return (
    <group>
      {/* Invisible hit sphere for cluster-level hover */}
      <mesh
        position={center}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHoverCluster(category);
        }}
        onPointerOut={() => onHoverCluster(null)}
      >
        <sphereGeometry args={[14, 16, 16]} />
        <meshBasicMaterial visible={false} transparent opacity={0} />
      </mesh>

      {/* Category label */}
      <Html
        position={[center[0], center[1] + 16, center[2]]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-tight transition-all duration-300 ${
            isHovered
              ? 'bg-card/95 border-primary/30 text-primary shadow-lg scale-110'
              : 'bg-card/60 border-border/40 text-muted-foreground'
          }`}
        >
          {formatCategory(category)}
          <span className="ml-1.5 text-[10px] font-normal opacity-70">
            {nodes.length}
          </span>
        </div>
      </Html>

      {/* Seeds */}
      {nodes.map((node) => (
        <SeedShape
          key={node.id}
          node={node}
          isHovered={hoveredNode?.id === node.id}
          isSelected={selectedNodeId === node.id}
          isDimmed={isDimmed && !isHovered}
          onHover={setHoveredNode}
          onClick={onNodeClick}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera controller — smooth focus on click                          */
/* ------------------------------------------------------------------ */
function CameraController({
  focusTarget,
}: {
  focusTarget: [number, number, number] | null;
}) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      // Swap left-drag to pan so users can drag to explore clusters
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    }
  }, []);

  useFrame(() => {
    if (controlsRef.current && focusTarget) {
      const target = new THREE.Vector3(...focusTarget);
      controlsRef.current.target.lerp(target, 0.06);

      const cam = controlsRef.current.object as THREE.Camera;
      const offset = new THREE.Vector3().subVectors(cam.position, controlsRef.current.target);
      // Pull camera closer when focusing on a seed so rotation feels local
      const desiredDist = 28;
      const currentDist = offset.length();
      const newDist = currentDist * 0.94 + desiredDist * 0.06;
      const desiredOffset = offset.normalize().multiplyScalar(newDist);
      const desiredPos = new THREE.Vector3().addVectors(target, desiredOffset);
      cam.position.lerp(desiredPos, 0.06);

      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={20}
      maxDistance={160}
      dampingFactor={0.05}
      enableDamping
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */
function Scene({
  data,
  hoveredCluster,
  setHoveredCluster,
  hoveredNode,
  setHoveredNode,
  onNodeClick,
  focusTarget,
  growingEdges,
  animKey,
  selectedNodeId,
}: {
  data: GraphData;
  hoveredCluster: string | null;
  setHoveredCluster: (c: string | null) => void;
  hoveredNode: GraphNode | null;
  setHoveredNode: (n: GraphNode | null) => void;
  onNodeClick: (n: GraphNode) => void;
  focusTarget: [number, number, number] | null;
  growingEdges: Set<string>;
  animKey: number;
  selectedNodeId: string | null;
}) {
  const layout = useClusteredLayout(data);
  const adjacency = useAdjacency(data);

  const activeId = hoveredNode?.id ?? selectedNodeId ?? null;
  const neighborIds = activeId ? adjacency[activeId] : new Set<string>();

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[30, 30, 30]} intensity={0.8} color="#fff5e6" />
      <pointLight position={[-20, -10, -20]} intensity={0.3} color="#e6e0ff" />

      {/* Edges */}
      {layout.edges.map((edge) => {
        const s = layout.nodeMap.get(edge.source);
        const t = layout.nodeMap.get(edge.target);
        if (!s || !t) return null;

        const isActive =
          activeId && (edge.source === activeId || edge.target === activeId);
        const isDimmed = activeId && !isActive;
        const isGrowing = growingEdges.has(edge.id);

        if (isGrowing) {
          return (
            <GrowingArcEdge
              key={`grow-${edge.id}-${animKey}`}
              source={s.pos}
              target={t.pos}
              color="#c46b5e"
              isDimmed={false}
            />
          );
        }

        return (
          <StaticArcEdge
            key={edge.id}
            source={s.pos}
            target={t.pos}
            color="#a8a29e"
            isActive={!!isActive}
            isDimmed={!!isDimmed}
          />
        );
      })}

      {/* Clusters */}
      {layout.clusters.map((cluster) => {
        const isHovered = hoveredCluster === cluster.category;
        const isDimmed = hoveredCluster
          ? hoveredCluster !== cluster.category
          : false;

        return (
          <Cluster
            key={cluster.category}
            cluster={cluster}
            isHovered={isHovered}
            isDimmed={isDimmed}
            onHoverCluster={setHoveredCluster}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            onNodeClick={onNodeClick}
            activeNodeId={activeId}
            neighborIds={neighborIds}
            growingEdges={growingEdges}
            selectedNodeId={selectedNodeId}
          />
        );
      })}

      {/* Node tooltip (only when a specific seed is hovered) */}
      {hoveredNode && (
        <Html
          position={layout.nodeMap.get(hoveredNode.id)?.pos ?? [0, 0, 0]}
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className="rounded-lg border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur whitespace-nowrap">
            <div className="text-xs font-medium text-primary">
              {formatCategory(hoveredNode.category)}
            </div>
            <div className="text-sm font-medium text-foreground">
              {hoveredNode.label}
            </div>
          </div>
        </Html>
      )}

      <CameraController focusTarget={focusTarget} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
export default function NestGraph({ data }: NestGraphProps) {
  const isDark = useTheme();
  const router = useRouter();
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const [growingEdges, setGrowingEdges] = useState<Set<string>>(new Set());
  const [animKey, setAnimKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const adjacency = useAdjacency(data);
  const layout = useClusteredLayout(data);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setFocusTarget(null);
    setGrowingEdges(new Set());
    setHoveredNode(null);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setHoveredNode(null);
      setSelectedNode(node);
      setFocusTarget(layout.nodeMap.get(node.id)?.pos ?? null);

      // Trigger growing-edge animation for all neighbours
      const neighbors = adjacency[node.id];
      if (neighbors) {
        const edgeIds = new Set<string>();
        data.edges.forEach((edge) => {
          if (
            (edge.source === node.id && neighbors.has(edge.target)) ||
            (edge.target === node.id && neighbors.has(edge.source))
          ) {
            edgeIds.add(edge.id);
          }
        });
        setGrowingEdges(new Set());
        // small delay so React clears old ones first
        requestAnimationFrame(() => {
          setGrowingEdges(edgeIds);
          setAnimKey((k) => k + 1);
        });
      }
    },
    [adjacency, data.edges, layout.nodeMap]
  );

  const handleReadArticle = useCallback(
    (node: GraphNode) => {
      router.push(`/wiki/${node.id}`);
    },
    [router]
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ height: '65vh', background: isDark ? '#161412' : '#fdfcfa' }}
      >
        <Canvas
          camera={{ position: [0, 0, 75], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <color
            attach="background"
            args={[isDark ? '#161412' : '#fdfcfa']}
          />
          <fog
            attach="fog"
            args={[isDark ? '#161412' : '#fdfcfa', 80, 180]}
          />
          <Scene
            data={data}
            hoveredCluster={hoveredCluster}
            setHoveredCluster={setHoveredCluster}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            onNodeClick={handleNodeClick}
            focusTarget={focusTarget}
            growingEdges={growingEdges}
            animKey={animKey}
            selectedNodeId={selectedNode?.id ?? null}
          />
        </Canvas>

        {/* Reset view button */}
        {selectedNode && (
          <button
            onClick={clearSelection}
            className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97]"
          >
            Reset view
          </button>
        )}

        {/* Selection card */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 z-10 max-w-xs rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {formatCategory(selectedNode.category)}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              {selectedNode.label}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleReadArticle(selectedNode)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
              >
                Read article
              </button>
              <button
                onClick={clearSelection}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="text-xs font-medium tracking-tight">Nest Graph</span>
        <span className="text-xs">Scroll to zoom · Left-drag to pan · Right-drag to rotate</span>
        <span className="text-xs text-muted-foreground/60">
          Click a seed to focus · Hover a cluster to highlight
        </span>
      </div>
    </div>
  );
}

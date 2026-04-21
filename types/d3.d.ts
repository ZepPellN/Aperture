declare module 'd3-contour' {
  export function contours(): {
    size(size: [number, number]): ReturnType<typeof contours>;
    thresholds(thresholds: number[]): ReturnType<typeof contours>;
    (values: Float32Array | number[]): Array<{
      type: 'MultiPolygon';
      value: number;
      coordinates: number[][][][];
    }>;
  };
}

declare module 'd3-geo' {
  export function geoPath(
    projection?: unknown,
    context?: CanvasRenderingContext2D
  ): {
    (feature: unknown): string | null;
  };
}

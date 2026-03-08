import Color from "color";

import type { GraphEdge, GraphNode } from "../Graph.model";

/** A style value map with string keys - simplified from the full SimpleStyleMap type */
type SimpleStyleMap = Record<string, unknown>;

export interface CosmosNodeData {
  /** Maps index in Float32Arrays back to the original node ID */
  indexToId: Map<number, string>;
  /** Maps original node ID to index in Float32Arrays */
  idToIndex: Map<string, number>;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

export interface CosmosLinkData {
  /** Maps index in the links array back to the original edge ID */
  indexToId: Map<number, string>;
  links: Float32Array;
  colors: Float32Array;
  widths: Float32Array;
  arrows: boolean[];
}

export interface CosmosData {
  nodes: CosmosNodeData;
  links: CosmosLinkData;
}

const DEFAULT_NODE_COLOR = [128, 128, 128, 255] as const;
const DEFAULT_NODE_SIZE = 12;
const DEFAULT_LINK_COLOR = [100, 100, 100, 180] as const;
const DEFAULT_LINK_WIDTH = 1;

/**
 * Parses a CSS color string into RGBA values (0-255).
 */
function parseColor(
  colorStr: string | undefined,
): [number, number, number, number] {
  if (!colorStr) return [...DEFAULT_NODE_COLOR];
  try {
    const c = new Color(colorStr);
    return [
      Math.round(c.red()),
      Math.round(c.green()),
      Math.round(c.blue()),
      Math.round(c.alpha() * 255),
    ];
  } catch {
    return [...DEFAULT_NODE_COLOR];
  }
}

/**
 * Finds the best matching style for a node based on Cytoscape selector format.
 * Supports selectors like `node[type="airport"]`.
 */
function findNodeStyle(
  node: GraphNode,
  styles?: Record<string, SimpleStyleMap>,
): SimpleStyleMap | undefined {
  if (!styles) return undefined;

  const nodeData = node.data as Record<string, unknown>;

  for (const [selector, style] of Object.entries(styles)) {
    if (!selector.startsWith("node")) continue;

    // Match selector like node[type="value"]
    const attrMatch = selector.match(/\[(\w+)="([^"]+)"\]/);
    if (attrMatch) {
      const [, attr, value] = attrMatch;
      if (nodeData[attr] === value) {
        return style;
      }
    }
  }
  return undefined;
}

/**
 * Finds the best matching style for an edge based on Cytoscape selector format.
 */
function findEdgeStyle(
  edge: GraphEdge,
  styles?: Record<string, SimpleStyleMap>,
): SimpleStyleMap | undefined {
  if (!styles) return undefined;

  const edgeData = edge.data as Record<string, unknown>;

  for (const [selector, style] of Object.entries(styles)) {
    if (!selector.startsWith("edge")) continue;

    const attrMatch = selector.match(/\[(\w+)="([^"]+)"\]/);
    if (attrMatch) {
      const [, attr, value] = attrMatch;
      if (edgeData[attr] === value) {
        return style;
      }
    }
  }
  return undefined;
}

/**
 * Transforms Cytoscape-format graph data into Cosmos-compatible Float32Arrays.
 */
export function transformToCosmos(
  nodes: GraphNode[],
  edges: GraphEdge[],
  styles?: Record<string, SimpleStyleMap>,
): CosmosData {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Build index mappings
  const indexToId = new Map<number, string>();
  const idToIndex = new Map<string, number>();

  for (let i = 0; i < nodeCount; i++) {
    const id = nodes[i].data.id;
    indexToId.set(i, id);
    idToIndex.set(id, i);
  }

  // Node positions - random initial positions, simulation will arrange them
  const positions = new Float32Array(nodeCount * 2);
  for (let i = 0; i < nodeCount; i++) {
    positions[i * 2] = (Math.random() - 0.5) * 1000;
    positions[i * 2 + 1] = (Math.random() - 0.5) * 1000;
  }

  // Node colors - RGBA
  const colors = new Float32Array(nodeCount * 4);
  const sizes = new Float32Array(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const style = findNodeStyle(nodes[i], styles);
    const bgColor = style?.["background-color"] as string | undefined;
    const [r, g, b, a] = parseColor(bgColor);
    colors[i * 4] = r;
    colors[i * 4 + 1] = g;
    colors[i * 4 + 2] = b;
    colors[i * 4 + 3] = a;
    sizes[i] =
      (style?.width as number | undefined) ??
      (style?.height as number | undefined) ??
      DEFAULT_NODE_SIZE;
  }

  // Links - source/target index pairs
  const linkIndexToId = new Map<number, string>();
  const validLinks: number[] = [];
  const linkColorsList: number[] = [];
  const linkWidthsList: number[] = [];
  const arrowsList: boolean[] = [];

  let linkIdx = 0;
  for (let i = 0; i < edgeCount; i++) {
    const edge = edges[i];
    const sourceIdx = idToIndex.get(edge.data.source);
    const targetIdx = idToIndex.get(edge.data.target);

    // Skip edges where source or target is missing
    if (sourceIdx === undefined || targetIdx === undefined) continue;

    linkIndexToId.set(linkIdx, edge.data.id);
    validLinks.push(sourceIdx, targetIdx);

    const style = findEdgeStyle(edge, styles);
    const lineColor = style?.["line-color"] as string | undefined;
    const [r, g, b, a] = lineColor
      ? parseColor(lineColor)
      : [...DEFAULT_LINK_COLOR];
    linkColorsList.push(r, g, b, a);

    linkWidthsList.push(
      (style?.width as number | undefined) ?? DEFAULT_LINK_WIDTH,
    );

    const targetArrow = style?.["target-arrow-shape"] as string | undefined;
    arrowsList.push(
      targetArrow !== undefined && targetArrow !== "none" && targetArrow !== "",
    );

    linkIdx++;
  }

  return {
    nodes: {
      indexToId,
      idToIndex,
      positions,
      colors,
      sizes,
    },
    links: {
      indexToId: linkIndexToId,
      links: new Float32Array(validLinks),
      colors: new Float32Array(linkColorsList),
      widths: new Float32Array(linkWidthsList),
      arrows: arrowsList,
    },
  };
}

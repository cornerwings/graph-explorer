import {
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/utils";

import { useGraphRef } from "./GraphContext";
import type { GraphProps, GraphRef } from "./Graph";
import { loadCosmosGraph, type CosmosGraphInstance } from "./cosmosLoader";

const DEFAULT_NODE_COLOR = [147, 197, 253, 1] as const;
const DEFAULT_OUT_OF_FOCUS_NODE_COLOR = [120, 120, 120, 0.25] as const;
const DEFAULT_EDGE_COLOR = [148, 163, 184, 0.8] as const;
const DEFAULT_OUT_OF_FOCUS_EDGE_COLOR = [120, 120, 120, 0.15] as const;

function createSyntheticGraphEvent(event: MouseEvent, x: number, y: number) {
  return {
    originalEvent: event,
    renderedPosition: {
      x,
      y,
    },
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation(),
  };
}

export function CosmosGraph({
  className,
  nodes,
  edges,
  selectedNodesIds,
  selectedEdgesIds,
  outOfFocusNodesIds,
  outOfFocusEdgesIds,
  onSelectedElementIdsChange,
  onNodeDoubleClick,
  onNodeRightClick,
  onEdgeRightClick,
  onGraphRightClick,
  onZoomChanged,
  onNodeMouseOver,
  onNodeMouseOut,
  onEdgeMouseOver,
  onEdgeMouseOut,
  hideEdges,
}: GraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cosmosGraphRef = useRef<CosmosGraphInstance | null>(null);
  const [selectedNodeIdsSet, selectedEdgeIdsSet] = useMemo(
    () => [new Set(selectedNodesIds), new Set(selectedEdgesIds)],
    [selectedEdgesIds, selectedNodesIds],
  );
  const [nodeIndexById, edgeIndexById] = useMemo(() => {
    const nextNodeIndexById = new Map<string, number>();
    nodes.forEach((node, index) => {
      nextNodeIndexById.set(node.data.id, index);
    });

    const nextEdgeIndexById = new Map<string, number>();
    edges.forEach((edge, index) => {
      nextEdgeIndexById.set(edge.data.id, index);
    });

    return [nextNodeIndexById, nextEdgeIndexById];
  }, [edges, nodes]);
  const [nodeIdByIndex, edgeIdByIndex] = useMemo(() => {
    return [
      nodes.map(node => node.data.id),
      edges.map(edge => edge.data.id),
    ] as const;
  }, [edges, nodes]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setupGraph = async () => {
      if (!containerRef.current) {
        return;
      }

      const CosmosGraphClass = await loadCosmosGraph();
      if (!isMounted || !containerRef.current) {
        return;
      }

      const graph = new CosmosGraphClass(containerRef.current, {
        backgroundColor: "#0f172a",
        fitViewOnInit: true,
        renderLinks: !hideEdges,
        enableDrag: true,
        onZoom: () => {
          onZoomChanged?.(graph.getZoomLevel());
        },
        onPointClick: (index: number, _pos: [number, number], event: MouseEvent) => {
          const nodeId = nodeIdByIndex[index];
          if (!nodeId) {
            return;
          }

          onSelectedElementIdsChange?.({
            nodeIds: new Set([nodeId]),
            edgeIds: new Set<string>(),
            groupIds: new Set<string>(),
          });

          const node = nodes[index]?.data;
          if (node && onNodeDoubleClick && event.detail > 1) {
            onNodeDoubleClick(
              createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
              node,
              { top: event.clientY, left: event.clientX, width: 1, height: 1 },
            );
          }
        },
        onPointContextMenu: (
          index: number,
          _pos: [number, number],
          event: MouseEvent,
        ) => {
          const node = nodes[index]?.data;
          if (!node || !onNodeRightClick) {
            return;
          }

          onNodeRightClick(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            node,
            { top: event.clientY, left: event.clientX, width: 1, height: 1 },
          );
        },
        onLinkContextMenu: (index: number, event: MouseEvent) => {
          const edge = edges[index]?.data;
          if (!edge || !onEdgeRightClick) {
            return;
          }

          onEdgeRightClick(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            edge,
            { top: event.clientY, left: event.clientX, width: 1, height: 1 },
          );
        },
        onBackgroundContextMenu: (event: MouseEvent) => {
          onGraphRightClick?.(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            { top: event.clientY, left: event.clientX },
          );
        },
        onPointMouseOver: (index: number, _pos: [number, number], event: MouseEvent) => {
          const node = nodes[index]?.data;
          if (!node || !onNodeMouseOver) {
            return;
          }

          onNodeMouseOver(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            node,
            { top: event.clientY, left: event.clientX, width: 1, height: 1 },
          );
        },
        onPointMouseOut: (event: MouseEvent) => {
          const selectedNodeId = [...selectedNodeIdsSet][0];
          const selectedNodeIndex =
            selectedNodeId === undefined ? undefined : nodeIndexById.get(selectedNodeId);
          const node =
            selectedNodeIndex === undefined
              ? undefined
              : nodes[selectedNodeIndex]?.data;
          if (!node || !onNodeMouseOut) {
            return;
          }

          onNodeMouseOut(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            node,
            { top: event.clientY, left: event.clientX, width: 1, height: 1 },
          );
        },
        onLinkMouseOver: (index: number) => {
          const edge = edges[index]?.data;
          if (!edge || !onEdgeMouseOver) {
            return;
          }

          onEdgeMouseOver(
            createSyntheticGraphEvent(new MouseEvent("mouseover"), 0, 0) as never,
            edge,
            { top: 0, left: 0, width: 1, height: 1 },
          );
        },
        onLinkMouseOut: (event: MouseEvent) => {
          const selectedEdgeId = [...selectedEdgeIdsSet][0];
          const selectedEdgeIndex =
            selectedEdgeId === undefined ? undefined : edgeIndexById.get(selectedEdgeId);
          const edge =
            selectedEdgeIndex === undefined
              ? undefined
              : edges[selectedEdgeIndex]?.data;
          if (!edge || !onEdgeMouseOut) {
            return;
          }

          onEdgeMouseOut(
            createSyntheticGraphEvent(event, event.clientX, event.clientY) as never,
            edge,
            { top: event.clientY, left: event.clientX, width: 1, height: 1 },
          );
        },
      });

      cosmosGraphRef.current = graph;
      setIsReady(true);
    };

    setupGraph().catch(() => {
      setIsReady(false);
    });

    return () => {
      isMounted = false;
      cosmosGraphRef.current?.destroy();
      cosmosGraphRef.current = null;
      setIsReady(false);
    };
  }, [
    edgeIndexById,
    edges,
    hideEdges,
    nodeIdByIndex,
    nodeIndexById,
    nodes,
    onEdgeMouseOut,
    onEdgeMouseOver,
    onEdgeRightClick,
    onGraphRightClick,
    onNodeDoubleClick,
    onNodeMouseOut,
    onNodeMouseOver,
    onNodeRightClick,
    onSelectedElementIdsChange,
    onZoomChanged,
    selectedEdgeIdsSet,
    selectedNodeIdsSet,
  ]);

  useEffect(() => {
    if (!isReady || !cosmosGraphRef.current) {
      return;
    }

    const graph = cosmosGraphRef.current;

    const pointPositions = new Float32Array(nodes.length * 2);
    nodes.forEach((_node, index) => {
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
      pointPositions[index * 2] = Math.cos(angle) * 100;
      pointPositions[index * 2 + 1] = Math.sin(angle) * 100;
    });

    graph.setPointPositions(pointPositions);

    const links = new Float32Array(edges.length * 2);
    edges.forEach((edge, index) => {
      links[index * 2] = nodeIndexById.get(edge.data.source) ?? 0;
      links[index * 2 + 1] = nodeIndexById.get(edge.data.target) ?? 0;
    });
    graph.setLinks(links);

    graph.setConfig({ renderLinks: !hideEdges });
    graph.render();
  }, [edgeIndexById, edges, hideEdges, isReady, nodeIndexById, nodes]);

  useEffect(() => {
    if (!isReady || !cosmosGraphRef.current) {
      return;
    }

    const nodeColors = new Float32Array(nodes.length * 4);
    nodes.forEach((node, index) => {
      const color = outOfFocusNodesIds?.has(node.data.id)
        ? DEFAULT_OUT_OF_FOCUS_NODE_COLOR
        : DEFAULT_NODE_COLOR;
      nodeColors[index * 4] = color[0];
      nodeColors[index * 4 + 1] = color[1];
      nodeColors[index * 4 + 2] = color[2];
      nodeColors[index * 4 + 3] = color[3];
    });

    const edgeColors = new Float32Array(edges.length * 4);
    edges.forEach((edge, index) => {
      const color = outOfFocusEdgesIds?.has(edge.data.id)
        ? DEFAULT_OUT_OF_FOCUS_EDGE_COLOR
        : DEFAULT_EDGE_COLOR;
      edgeColors[index * 4] = color[0];
      edgeColors[index * 4 + 1] = color[1];
      edgeColors[index * 4 + 2] = color[2];
      edgeColors[index * 4 + 3] = color[3];
    });

    cosmosGraphRef.current.setPointColors(nodeColors);
    cosmosGraphRef.current.setLinkColors(edgeColors);

    const selectedNodeIndices = [...selectedNodeIdsSet]
      .map(nodeId => nodeIndexById.get(nodeId))
      .filter((index): index is number => index !== undefined);
    cosmosGraphRef.current.setSelectedPointIndices(selectedNodeIndices);

    const selectedEdgeIndices = [...selectedEdgeIdsSet]
      .map(edgeId => edgeIndexById.get(edgeId))
      .filter((index): index is number => index !== undefined);
    cosmosGraphRef.current.setSelectedLinkIndices(selectedEdgeIndices);
  }, [
    edgeIdByIndex,
    edgeIndexById,
    edges,
    isReady,
    nodeIdByIndex,
    nodeIndexById,
    nodes,
    outOfFocusEdgesIds,
    outOfFocusNodesIds,
    selectedEdgeIdsSet,
    selectedNodeIdsSet,
  ]);

  const graphRef = useGraphRef();
  useImperativeHandle(
    graphRef,
    (): GraphRef => ({
      runLayout: () => {
        cosmosGraphRef.current?.start(1);
      },
      fitToCanvas: () => {
        cosmosGraphRef.current?.fitView(250, 0.2);
      },
      zoomIn: () => {
        const graph = cosmosGraphRef.current;
        if (!graph) {
          return;
        }
        graph.zoom(graph.getZoomLevel() + 0.2, 150);
      },
      zoomOut: () => {
        const graph = cosmosGraphRef.current;
        if (!graph) {
          return;
        }
        graph.zoom(graph.getZoomLevel() - 0.2, 150);
      },
      saveScreenshot: () => {
        const canvas = containerRef.current?.querySelector("canvas");
        if (!canvas) {
          return;
        }

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `graph-${Date.now()}.png`;
        link.click();
      },
    }),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative size-full overflow-hidden", className)}
      inert={!nodes.length && !edges.length}
    />
  );
}

export default memo(CosmosGraph);

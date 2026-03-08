import { Graph as CosmosGraphInstance } from "@cosmos.gl/graph";
import {
  type ComponentPropsWithoutRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { cn } from "@/utils";

import type { GraphEdge, GraphNode } from "../Graph.model";

import { useGraphRef } from "../GraphContext";
import { transformToCosmos } from "./cosmosDataTransform";

export interface CosmosGraphProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  nodes: GraphNode[];
  edges: GraphEdge[];
  styles?: Record<string, Record<string, unknown>>;
  selectedNodesIds?: Array<string> | Set<string>;
  selectedEdgesIds?: Array<string> | Set<string>;
  onNodeDoubleClick?: (...args: any[]) => void;
  onNodeRightClick?: (...args: any[]) => void;
  onEdgeRightClick?: (...args: any[]) => void;
  onGraphRightClick?: (...args: any[]) => void;
  outOfFocusNodesIds?: Set<string>;
  outOfFocusEdgesIds?: Set<string>;
}

const CosmosGraph = ({
  nodes,
  edges,
  styles,
  selectedNodesIds,
  onNodeDoubleClick,
  onNodeRightClick,
  onEdgeRightClick: _onEdgeRightClick,
  onGraphRightClick,
  outOfFocusNodesIds,
  className,
  ...props
}: CosmosGraphProps) => {
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);
  const wrapperRefCb = useCallback(
    (domElement: HTMLDivElement | null) => setWrapper(domElement),
    [],
  );

  const cosmosRef = useRef<CosmosGraphInstance | null>(null);
  const idMapRef = useRef<{
    indexToId: Map<number, string>;
    idToIndex: Map<string, number>;
    linkIndexToId: Map<number, string>;
  }>({
    indexToId: new Map(),
    idToIndex: new Map(),
    linkIndexToId: new Map(),
  });

  // Store current nodes for lookup in handlers
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Store event handlers in refs to avoid re-creating cosmos on handler changes
  const handlersRef = useRef({
    onNodeDoubleClick,
    onNodeRightClick,
    onGraphRightClick,
  });
  useEffect(() => {
    handlersRef.current = {
      onNodeDoubleClick,
      onNodeRightClick,
      onGraphRightClick,
    };
  }, [onNodeDoubleClick, onNodeRightClick, onGraphRightClick]);

  // Initialize cosmos instance
  useEffect(() => {
    if (!wrapper) return;

    const cosmos = new CosmosGraphInstance(wrapper, {
      backgroundColor: "#1a1a2e",
      pointDefaultColor: "#b3b3b3",
      pointDefaultSize: 12,
      pointSizeScale: 1,
      linkDefaultColor: "#666666",
      linkDefaultWidth: 1,
      linkWidthScale: 1,
      renderLinks: true,
      curvedLinks: true,
      curvedLinkSegments: 19,
      linkDefaultArrows: true,
      linkArrowsSizeScale: 0.5,
      enableSimulation: true,
      simulationRepulsion: 1.0,
      simulationGravity: 0.25,
      simulationLinkSpring: 1,
      simulationLinkDistance: 10,
      simulationFriction: 0.85,
      fitViewOnInit: true,
      fitViewDelay: 250,
      enableZoom: true,
      enableDrag: true,
      renderHoveredPointRing: true,
      hoveredPointRingColor: "white",
      pointGreyoutOpacity: 0.3,
      linkGreyoutOpacity: 0.1,
      linkOpacity: 0.6,
      onPointClick: (index: number | undefined) => {
        if (index === undefined) return;
        const id = idMapRef.current.indexToId.get(index);
        if (id) {
          cosmos.selectPointByIndex(index, true);
        }
      },
      onBackgroundClick: () => {
        cosmos.unselectPoints();
      },
    });

    cosmosRef.current = cosmos;

    return () => {
      cosmos.destroy();
      cosmosRef.current = null;
    };
  }, [wrapper]);

  // Handle double-click via native DOM event on the wrapper
  useEffect(() => {
    if (!wrapper) return;

    const handleDblClick = (event: MouseEvent) => {
      const cosmos = cosmosRef.current;
      if (!cosmos) return;

      // Get all point positions and find the closest to click
      const positions = cosmos.getPointPositions?.();
      if (!positions || positions.length === 0) return;

      const rect = wrapper.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let closestIndex: number | undefined;
      let closestDist = Infinity;

      const nodeCount = positions.length / 2;
      for (let i = 0; i < nodeCount; i++) {
        const spacePos: [number, number] = [
          positions[i * 2],
          positions[i * 2 + 1],
        ];
        const screenPos = cosmos.spaceToScreenPosition(spacePos);
        if (!screenPos) continue;
        const dist = Math.hypot(screenPos[0] - clickX, screenPos[1] - clickY);
        if (dist < closestDist && dist < 30) {
          closestDist = dist;
          closestIndex = i;
        }
      }

      if (closestIndex !== undefined) {
        const id = idMapRef.current.indexToId.get(closestIndex);
        if (id) {
          const node = nodesRef.current.find(n => n.data.id === id);
          if (node) {
            handlersRef.current.onNodeDoubleClick?.(event, node.data);
          }
        }
      }
    };

    wrapper.addEventListener("dblclick", handleDblClick);
    return () => wrapper.removeEventListener("dblclick", handleDblClick);
  }, [wrapper]);

  // Handle right-click via native DOM event
  useEffect(() => {
    if (!wrapper) return;

    const handleContextMenu = (event: MouseEvent) => {
      const cosmos = cosmosRef.current;
      if (!cosmos) return;

      const positions = cosmos.getPointPositions?.();
      if (!positions || positions.length === 0) {
        handlersRef.current.onGraphRightClick?.(event);
        return;
      }

      const rect = wrapper.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let closestIndex: number | undefined;
      let closestDist = Infinity;

      const nodeCount = positions.length / 2;
      for (let i = 0; i < nodeCount; i++) {
        const spacePos: [number, number] = [
          positions[i * 2],
          positions[i * 2 + 1],
        ];
        const screenPos = cosmos.spaceToScreenPosition(spacePos);
        if (!screenPos) continue;
        const dist = Math.hypot(screenPos[0] - clickX, screenPos[1] - clickY);
        if (dist < closestDist && dist < 30) {
          closestDist = dist;
          closestIndex = i;
        }
      }

      if (closestIndex !== undefined) {
        const id = idMapRef.current.indexToId.get(closestIndex);
        if (id) {
          const node = nodesRef.current.find(n => n.data.id === id);
          if (node) {
            handlersRef.current.onNodeRightClick?.(event, node.data);
            return;
          }
        }
      }

      handlersRef.current.onGraphRightClick?.(event);
    };

    wrapper.addEventListener("contextmenu", handleContextMenu);
    return () => wrapper.removeEventListener("contextmenu", handleContextMenu);
  }, [wrapper]);

  // Update data when nodes/edges/styles change
  useEffect(() => {
    const cosmos = cosmosRef.current;
    if (!cosmos) return;

    if (nodes.length === 0) {
      cosmos.setPointPositions(new Float32Array(0));
      cosmos.setLinks(new Float32Array(0));
      cosmos.render();
      return;
    }

    const data = transformToCosmos(nodes, edges, styles);

    // Update the ID maps
    idMapRef.current = {
      indexToId: data.nodes.indexToId,
      idToIndex: data.nodes.idToIndex,
      linkIndexToId: data.links.indexToId,
    };

    cosmos.setPointPositions(data.nodes.positions);
    cosmos.setPointColors(data.nodes.colors);
    cosmos.setPointSizes(data.nodes.sizes);
    cosmos.setLinks(data.links.links);
    cosmos.setLinkColors(data.links.colors);
    cosmos.setLinkWidths(data.links.widths);
    cosmos.setLinkArrows(data.links.arrows);

    // Handle out-of-focus nodes by greying them out
    if (outOfFocusNodesIds && outOfFocusNodesIds.size > 0) {
      const greyedColors = new Float32Array(data.nodes.colors);
      for (const outId of outOfFocusNodesIds) {
        const idx = data.nodes.idToIndex.get(outId);
        if (idx !== undefined) {
          greyedColors[idx * 4] = 100;
          greyedColors[idx * 4 + 1] = 100;
          greyedColors[idx * 4 + 2] = 100;
          greyedColors[idx * 4 + 3] = 80;
        }
      }
      cosmos.setPointColors(greyedColors);
    }

    cosmos.render();
  }, [nodes, edges, styles, outOfFocusNodesIds]);

  // Handle selection
  useEffect(() => {
    const cosmos = cosmosRef.current;
    if (!cosmos) return;

    if (selectedNodesIds) {
      const ids = Array.isArray(selectedNodesIds)
        ? selectedNodesIds
        : [...selectedNodesIds];
      const indices = ids
        .map(id => idMapRef.current.idToIndex.get(id))
        .filter((idx): idx is number => idx !== undefined);
      if (indices.length > 0) {
        cosmos.selectPointsByIndices(indices);
      } else {
        cosmos.unselectPoints();
      }
    }
  }, [selectedNodesIds]);

  // Set the graphRef context value for compatibility with graph control buttons
  const graphRef = useGraphRef();
  useImperativeHandle(
    graphRef,
    () => ({
      cosmos: cosmosRef.current ?? undefined,
      runLayout: () => {
        cosmosRef.current?.render(1);
      },
      fitView: () => {
        cosmosRef.current?.fitView(250);
      },
      zoomIn: () => {
        const cosmos = cosmosRef.current;
        if (!cosmos) return;
        const current = cosmos.getZoomLevel();
        cosmos.setZoomLevel((current ?? 1) * 1.5, 150);
      },
      zoomOut: () => {
        const cosmos = cosmosRef.current;
        if (!cosmos) return;
        const current = cosmos.getZoomLevel();
        cosmos.setZoomLevel((current ?? 1) / 1.5, 150);
      },
      saveScreenshot: () => {
        if (!wrapper) return;
        const canvases = wrapper.querySelectorAll("canvas");
        if (!canvases || canvases.length === 0) return;

        const canvas = document.createElement("canvas");
        canvas.width = canvases[0].width;
        canvas.height = canvases[0].height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvases.forEach(cnvs => {
          ctx.drawImage(cnvs, 0, 0);
        });

        return canvas.toDataURL("image/png", 1);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wrapper, cosmosRef.current],
  );

  const isEmpty = !nodes.length && !edges.length;

  return (
    <div
      className={cn("relative size-full overflow-hidden", className)}
      ref={wrapperRefCb}
      inert={isEmpty}
      {...props}
    />
  );
};

export default memo(CosmosGraph);

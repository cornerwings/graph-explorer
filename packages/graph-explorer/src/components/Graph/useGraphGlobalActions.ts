import { saveAs } from "file-saver";
import { useEffect, useState } from "react";

import { useGraphRef } from "@/components/Graph/GraphContext";
import {
  createRenderedEdgeId,
  createRenderedVertexId,
  type EdgeId,
  type VertexId,
} from "@/core";

const ANIMATION_DURATION = 150;
const ANIMATION_EASING = "ease-in-out-cubic";

export function useGraphGlobalActions() {
  const graphRef = useGraphRef();
  const [isZoomInDisabled, setIsZoomInDisabled] = useState(false);
  const [isZoomOutDisabled, setIsZoomOutDisabled] = useState(false);

  useEffect(() => {
    const cy = graphRef?.current?.cytoscape;
    if (!cy) return;

    const updateFunction = () => {
      setIsZoomInDisabled(cy.zoom() === cy.maxZoom());
      setIsZoomOutDisabled(cy.zoom() === cy.minZoom());
    };
    // Call to set values on initialization
    updateFunction();

    cy.on("zoom", updateFunction);
    return () => {
      cy.off("zoom", updateFunction);
    };
    // graphRef is a reference that doesn't change but cytoscape can
    //eslint-disable-next-line
  }, [graphRef?.current?.cytoscape]);

  const onFitSelectionToCanvas = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const elements = cy.elements(":selected");
    cy.animate({
      fit: { eles: elements, padding: 48 },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onFitVertexToCanvas = (vertexId: VertexId) => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const id = createRenderedVertexId(vertexId);
    const element = cy.getElementById(id);
    cy.animate({
      fit: { eles: element, padding: 48 },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onFitEdgeToCanvas = (edgeId: EdgeId) => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const id = createRenderedEdgeId(edgeId);
    const element = cy.getElementById(id);
    cy.animate({
      fit: { eles: element, padding: 48 },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onFitAllToCanvas = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    cy.animate({
      fit: { eles: cy.elements(), padding: 48 },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onCenterGraph = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const selectedElements = cy.elements(":selected");
    cy.animate({
      center: {
        eles: selectedElements.nonempty() ? selectedElements : cy.elements(),
      },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onCenterVertex = (vertexId: VertexId) => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const id = createRenderedVertexId(vertexId);
    const element = cy.getElementById(id);
    cy.animate({
      center: { eles: element },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onCenterEdge = (edgeId: EdgeId) => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    const id = createRenderedEdgeId(edgeId);
    const selectedElements = cy.getElementById(id);
    cy.animate({
      center: { eles: selectedElements },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onRunLayout = () => {
    graphRef.current?.runLayout();
  };

  const onCenterEntireGraph = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.fitView?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    cy.animate({
      center: { eles: cy.elements() },
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onSaveScreenshot = () => {
    if (graphRef?.current?.cosmos) {
      const dataUrl = graphRef?.current?.saveScreenshot?.();
      if (dataUrl) {
        saveAs(dataUrl, `graph-${new Date().getTime()}.png`);
      }
      return;
    }

    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    // cy.png does NOT RENDER CUSTOM BADGES
    // such node name or connections because they are rendered using
    // cytoscape-canvas plugin.
    // The alternative is export the current view of the graph by merging all
    // canvases under the cytoscape root container.

    // Get all canvases from the container
    const canvases = cy.container()?.querySelectorAll("canvas");

    if (!canvases || canvases.length === 0) {
      return;
    }

    // Create a canvas element and assign to it the same size that one of the
    // cytoscape canvases
    const canvas = document.createElement("canvas");
    canvas.width = canvases[0].width;
    canvas.height = canvases[0].height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Copy each canvas from cytoscape into the new canvas
    canvases.forEach(cnvs => {
      ctx.drawImage(cnvs, 0, 0);
    });

    const data = canvas.toDataURL("image/png", 1);
    saveAs(data, `graph-${new Date().getTime()}.png`);
  };

  const onZoomIn = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.zoomIn?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }

    cy.animate({
      zoom: cy.zoom() + 0.5,
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  const onZoomOut = () => {
    if (graphRef?.current?.cosmos) {
      graphRef?.current?.zoomOut?.();
      return;
    }
    const cy = graphRef?.current?.cytoscape;
    if (!cy) {
      return;
    }
    cy.animate({
      zoom: cy.zoom() - 0.5,
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  };

  return {
    onFitSelectionToCanvas,
    onFitVertexToCanvas,
    onFitEdgeToCanvas,
    onFitAllToCanvas,
    onRunLayout,
    onCenterGraph,
    onCenterVertex,
    onCenterEdge,
    onCenterEntireGraph,
    onSaveScreenshot,
    onZoomIn,
    onZoomOut,
    isZoomInDisabled,
    isZoomOutDisabled,
  };
}

import { Graph as CosmosGraph } from "@cosmos.gl/graph";
/**
 * Standalone demo page for comparing Cytoscape.js and Cosmos renderers.
 * This is served at /cosmos-demo via vite config.
 */
import cytoscape from "cytoscape";

// --- Generate sample graph data ---
const NODE_COUNT = 150;
const EDGE_COUNT = 250;
const TYPES = ["Person", "Company", "Location", "Product", "Event"];
const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];

function randomType() {
  return Math.floor(Math.random() * TYPES.length);
}

const nodeTypes: number[] = [];
const cyNodes: cytoscape.ElementDefinition[] = [];
for (let i = 0; i < NODE_COUNT; i++) {
  const typeIdx = randomType();
  nodeTypes.push(typeIdx);
  cyNodes.push({
    data: {
      id: `n${i}`,
      label: `${TYPES[typeIdx]} ${i}`,
      type: TYPES[typeIdx],
      color: COLORS[typeIdx],
    },
  });
}

const cyEdges: cytoscape.ElementDefinition[] = [];
const edgeSet = new Set<string>();
for (let i = 0; i < EDGE_COUNT; i++) {
  let s: number, t: number;
  do {
    s = Math.floor(Math.random() * NODE_COUNT);
    t = Math.floor(Math.random() * NODE_COUNT);
  } while (s === t || edgeSet.has(`${s}-${t}`));
  edgeSet.add(`${s}-${t}`);
  cyEdges.push({
    data: { id: `e${i}`, source: `n${s}`, target: `n${t}` },
  });
}

// --- Render Cytoscape ---
const cyContainer = document.getElementById("cy")!;
cytoscape({
  container: cyContainer,
  elements: { nodes: cyNodes, edges: cyEdges },
  style: [
    {
      selector: "node",
      style: {
        "background-color": "data(color)" as any,
        label: "",
        width: 14,
        height: 14,
        "border-width": 1,
        "border-color": "#fff",
        "border-opacity": 0.3,
      },
    },
    {
      selector: "edge",
      style: {
        width: 0.5,
        "line-color": "#555",
        "target-arrow-color": "#555",
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.5,
        "curve-style": "bezier",
        opacity: 0.4,
      },
    },
  ],
  layout: {
    name: "cose",
    animate: false,
    randomize: true,
    idealEdgeLength: () => 80,
    nodeRepulsion: () => 5000,
  },
  minZoom: 0.1,
  maxZoom: 5,
});

// --- Render Cosmos ---
const cosmosContainer = document.getElementById("cosmos-container")!;

const positions = new Float32Array(NODE_COUNT * 2);
for (let i = 0; i < NODE_COUNT; i++) {
  positions[i * 2] = (Math.random() - 0.5) * 600;
  positions[i * 2 + 1] = (Math.random() - 0.5) * 600;
}

const colors = new Float32Array(NODE_COUNT * 4);
const sizes = new Float32Array(NODE_COUNT);
for (let i = 0; i < NODE_COUNT; i++) {
  const hex = COLORS[nodeTypes[i]];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  colors[i * 4] = r;
  colors[i * 4 + 1] = g;
  colors[i * 4 + 2] = b;
  colors[i * 4 + 3] = 255;
  sizes[i] = 6;
}

const links = new Float32Array(EDGE_COUNT * 2);
const linkColors = new Float32Array(EDGE_COUNT * 4);
const linkWidths = new Float32Array(EDGE_COUNT);
const linkArrows: boolean[] = [];
for (let i = 0; i < EDGE_COUNT; i++) {
  const src = parseInt(cyEdges[i].data.source!.slice(1));
  const tgt = parseInt(cyEdges[i].data.target!.slice(1));
  links[i * 2] = src;
  links[i * 2 + 1] = tgt;
  linkColors[i * 4] = 100;
  linkColors[i * 4 + 1] = 100;
  linkColors[i * 4 + 2] = 140;
  linkColors[i * 4 + 3] = 150;
  linkWidths[i] = 0.5;
  linkArrows.push(true);
}

const graph = new CosmosGraph(cosmosContainer, {
  backgroundColor: "#1a1a2e",
  pointDefaultSize: 6,
  pointSizeScale: 1,
  renderLinks: true,
  curvedLinks: true,
  curvedLinkSegments: 15,
  linkDefaultArrows: true,
  linkArrowsSizeScale: 0.4,
  enableSimulation: true,
  simulationRepulsion: 0.8,
  simulationGravity: 0.2,
  simulationLinkSpring: 0.8,
  simulationLinkDistance: 8,
  simulationFriction: 0.9,
  fitViewOnInit: true,
  enableZoom: true,
  enableDrag: true,
  renderHoveredPointRing: true,
  hoveredPointRingColor: "#ffffff",
  linkOpacity: 0.5,
});

graph.setPointPositions(positions);
graph.setPointColors(colors);
graph.setPointSizes(sizes);
graph.setLinks(links);
graph.setLinkColors(linkColors);
graph.setLinkWidths(linkWidths);
graph.setLinkArrows(linkArrows);
graph.render();

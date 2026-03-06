import { lazy, Suspense } from "react";

import type { GraphProps } from "./Graph";

const CytoscapeGraphImpl = lazy(() => import("./Graph"));
const CosmosGraphImpl = lazy(() => import("./CosmosGraph"));

function shouldUseCosmosRenderer() {
  return import.meta.env.VITE_GRAPH_RENDERER?.toLowerCase() === "cosmos";
}

/**
 * Lazy-loaded Graph component wrapper.
 * Defers loading of the graph renderer bundle until the component is rendered.
 */
export default function Graph(props: GraphProps) {
  const GraphImpl = shouldUseCosmosRenderer()
    ? CosmosGraphImpl
    : CytoscapeGraphImpl;

  return (
    <Suspense>
      <GraphImpl {...props} />
    </Suspense>
  );
}

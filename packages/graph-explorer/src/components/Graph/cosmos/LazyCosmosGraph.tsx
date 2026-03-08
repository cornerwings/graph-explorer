import { lazy, Suspense } from "react";

import type { CosmosGraphProps } from "./CosmosGraph";

const CosmosGraphImpl = lazy(() => import("./CosmosGraph"));

/**
 * Lazy-loaded CosmosGraph component wrapper.
 * Defers loading of the @cosmos.gl/graph bundle until the component is rendered.
 */
export default function CosmosGraph(props: CosmosGraphProps) {
  return (
    <Suspense>
      <CosmosGraphImpl {...props} />
    </Suspense>
  );
}

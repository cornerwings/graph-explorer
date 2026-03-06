const COSMOS_SCRIPT_ID = "cosmos-gl-graph-script";
const COSMOS_SCRIPT_SRC =
  "https://unpkg.com/@cosmos.gl/graph@3.0.0-beta.6/dist/index.min.js";

type CosmosGraphClass = new (
  container: HTMLDivElement,
  config?: Record<string, unknown>,
) => CosmosGraphInstance;

export type CosmosGraphInstance = {
  destroy(): void;
  fitView(duration?: number, padding?: number): void;
  getZoomLevel(): number;
  render(): void;
  setConfig(config: Record<string, unknown>): void;
  setLinkColors(colors: Float32Array): void;
  setLinks(links: Float32Array): void;
  setPointColors(colors: Float32Array): void;
  setPointPositions(positions: Float32Array): void;
  setSelectedLinkIndices(indices: number[]): void;
  setSelectedPointIndices(indices: number[]): void;
  start(alpha?: number): void;
  zoom(value: number, duration?: number): void;
};

declare global {
  interface Window {
    Cosmos?: {
      Graph: CosmosGraphClass;
    };
  }
}

let cosmosGraphPromise: Promise<CosmosGraphClass> | undefined;

export function loadCosmosGraph() {
  if (window.Cosmos?.Graph) {
    return Promise.resolve(window.Cosmos.Graph);
  }

  if (cosmosGraphPromise) {
    return cosmosGraphPromise;
  }

  cosmosGraphPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(COSMOS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.Cosmos?.Graph) {
          resolve(window.Cosmos.Graph);
          return;
        }

        reject(new Error("Cosmos graph script loaded without Graph export."));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load cosmos graph script."));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = COSMOS_SCRIPT_ID;
    script.src = COSMOS_SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      if (!window.Cosmos?.Graph) {
        reject(new Error("Cosmos graph script loaded without Graph export."));
        return;
      }
      resolve(window.Cosmos.Graph);
    };
    script.onerror = () => {
      reject(new Error("Failed to load cosmos graph script."));
    };

    document.head.appendChild(script);
  });

  return cosmosGraphPromise;
}

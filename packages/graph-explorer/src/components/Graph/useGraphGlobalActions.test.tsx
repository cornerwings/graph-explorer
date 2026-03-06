import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GraphRef } from "./Graph";
import { useGraphGlobalActions } from "./useGraphGlobalActions";

const graphRefMock: { current: GraphRef | null } = {
  current: null,
};

vi.mock("@/components/Graph/GraphContext", () => ({
  useGraphRef: () => graphRefMock,
}));

describe("useGraphGlobalActions", () => {
  it("uses renderer-provided fit/zoom/screenshot actions when available", () => {
    const fitToCanvas = vi.fn();
    const zoomIn = vi.fn();
    const zoomOut = vi.fn();
    const saveScreenshot = vi.fn();

    graphRefMock.current = {
      runLayout: vi.fn(),
      fitToCanvas,
      zoomIn,
      zoomOut,
      saveScreenshot,
    };

    const { result } = renderHook(() => useGraphGlobalActions());

    act(() => {
      result.current.onFitAllToCanvas();
      result.current.onZoomIn();
      result.current.onZoomOut();
      result.current.onSaveScreenshot();
    });

    expect(fitToCanvas).toHaveBeenCalledTimes(1);
    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).toHaveBeenCalledTimes(1);
    expect(saveScreenshot).toHaveBeenCalledTimes(1);
  });
});

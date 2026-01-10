import * as d3 from "d3";
import { createEffect, createMemo, type Accessor } from "solid-js";
import { useBoardTransformContext } from "../contexts/board-transform";

export type Transform = {
  k: number;
  x: number;
  y: number;
};

type UseZoomTransformArgs = {
  ref: Accessor<SVGElement | undefined>;
};

export const useZoomTransform = (args: UseZoomTransformArgs) => {
  const boardTransformContext = useBoardTransformContext();

  const onZoomed = (event: { transform: Transform }) => {
    // oxlint-disable-next-line no-explicit-any
    boardTransformContext().setTransform(event.transform as any);
  };

  const width = createMemo(() => boardTransformContext().width);
  const height = createMemo(() => boardTransformContext().height);

  createEffect(() => {
    const refValue = args.ref();

    if (!refValue) {
      return;
    }

    const plugin = d3
      .zoom()
      .extent([
        [0, 0],
        [width(), height()],
      ])
      .scaleExtent([1, 8])
      .on("zoom", onZoomed);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);
  });
};

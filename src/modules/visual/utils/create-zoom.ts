import * as d3 from "d3";
import { createEffect, type Accessor } from "solid-js";

export type Transform = {
  k: number;
  x: number;
  y: number;
};

type CreateZoomArgs = {
  ref: Accessor<SVGElement | undefined>;
  onZoomed: (transform: Transform) => void;
  height: Accessor<number>;
  width: Accessor<number>;
};

export const createZoom = (args: CreateZoomArgs) => {
  const onZoomed = (event: { transform: Transform }) => {
    args.onZoomed(event.transform);
  };

  createEffect(() => {
    const refValue = args.ref();

    if (!refValue) {
      return;
    }

    const plugin = d3
      .zoom()
      .extent([
        [0, 0],
        [args.width(), args.height()],
      ])
      .scaleExtent([1, 8])
      .on("zoom", onZoomed);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);
  });
};

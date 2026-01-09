import * as d3 from "d3";
import { createEffect, type Accessor } from "solid-js";

type CreateZoomArgs = {
  ref: Accessor<SVGElement | undefined>;
  onZoomed: (transform: string) => void;
  height: Accessor<number>;
  width: Accessor<number>;
};

export const createZoom = (args: CreateZoomArgs) => {
  const onZoomed = ({ transform }: { transform: string }) => {
    args.onZoomed(transform);
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

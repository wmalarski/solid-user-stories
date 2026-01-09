import * as d3 from "d3";
import { createEffect, type Accessor } from "solid-js";
import type { Point2D } from "~/modules/editor/utils/types";
import { useDragContext } from "../components/drag-group";

type CreateDragArgs = {
  ref: Accessor<SVGElement | undefined>;
  onDragStarted?: () => void;
  onDragged: (point: Point2D) => void;
  onDragEnded?: () => void;
};

export const createDrag = (args: CreateDragArgs) => {
  const dragContext = useDragContext();

  const onDragStarted = () => {
    const refValue = args.ref();
    if (refValue) {
      d3.select(refValue).raise();
      dragContext().onDragStart();
      args.onDragStarted?.();
    }
  };

  const onDragged = (event: { x: number; y: number }) => {
    args.onDragged({ x: event.x, y: event.y });
  };

  const onDragEnded = () => {
    dragContext().onDragEnd();
    args.onDragEnded?.();
  };

  createEffect(() => {
    const refValue = args.ref();
    if (!refValue) {
      return;
    }

    const plugin = d3
      .drag()
      .on("start", onDragStarted)
      .on("drag", onDragged)
      .on("end", onDragEnded);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);
  });
};

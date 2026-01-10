import * as d3 from "d3";
import { createEffect, type Accessor } from "solid-js";
import { useDragContext } from "../components/drag-group";

type CreateDragArgs = {
  ref: Accessor<SVGElement | undefined>;
  onDragStarted?: (event: DragEvent) => void;
  onDragged: (event: DragEvent) => void;
  onDragEnded?: (event: DragEvent) => void;
};

export const createDrag = (args: CreateDragArgs) => {
  const dragContext = useDragContext();

  const onDragStarted = (event: DragEvent) => {
    const refValue = args.ref();
    if (refValue) {
      d3.select(refValue).raise();
      dragContext().onDragStart();
      args.onDragStarted?.(event);
    }
  };

  const onDragged = (event: DragEvent) => {
    args.onDragged(event);
  };

  const onDragEnded = (event: DragEvent) => {
    dragContext().onDragEnd();
    args.onDragEnded?.(event);
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

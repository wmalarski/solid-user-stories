import * as d3 from "d3";
import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";
import { useDragStateContext } from "../contexts/drag-state";
import { useToolsStateContext } from "../contexts/tools-state";

type CreateD3DragElementArgs = {
  ref: Accessor<SVGElement | undefined>;
  onDragStarted?: (event: DragEvent) => void;
  onDragged: (event: DragEvent) => void;
  onDragEnded?: (event: DragEvent) => void;
};

export const createD3DragElement = (args: CreateD3DragElementArgs) => {
  const [_isDragging, { onDragEnd, onDragStart }] = useDragStateContext();
  const [toolsState] = useToolsStateContext();

  const [isLocalDragging, setIsLocalDragging] = createSignal(false);

  const onDragStarted = (event: DragEvent) => {
    onDragStart();
    setIsLocalDragging(true);
    args.onDragStarted?.(event);
  };

  const onDragged = (event: DragEvent) => {
    args.onDragged(event);
  };

  const onDragEnded = (event: DragEvent) => {
    onDragEnd();
    setIsLocalDragging(false);
    args.onDragEnded?.(event);
  };

  createEffect(() => {
    const refValue = args.ref();
    const toolsStateValue = toolsState();

    if (!refValue || toolsStateValue !== "pane") {
      return;
    }

    const plugin = d3
      .drag()
      .on("start", onDragStarted)
      .on("drag", onDragged)
      .on("end", onDragEnded);

    // oxlint-disable-next-line unicorn/no-abusive-eslint-disable
    // oxlint-disable-next-line no-explicit-any typescript/no-unsafe-argument typescript/no-unsafe-type-assertion
    d3.select(refValue).call(plugin as any);

    onCleanup(() => {
      d3.select(refValue).on(".start .drag .end", null);
    });
  });

  return isLocalDragging;
};

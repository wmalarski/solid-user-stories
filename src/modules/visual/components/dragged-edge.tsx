import * as d3 from "d3";
import { createMemo, Show, type Component } from "solid-js";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { AnimatedPath } from "../ui/animated-path";

export const DraggedEdge: Component = () => {
  const [edgeDragState] = useEdgeDragStateContext();

  return (
    <Show when={edgeDragState.isDragging && edgeDragState.hasPosition}>
      <DraggedEdgeWithTask />
    </Show>
  );
};

const DraggedEdgeWithTask: Component = () => {
  const [edgeDragState] = useEdgeDragStateContext();

  const path = createMemo(() => {
    const cursorX = edgeDragState.cursor.x;
    const cursorY = edgeDragState.cursor.y;
    const startX = edgeDragState.start.x;
    const startY = edgeDragState.start.y;

    const breakXValue = (cursorX + startX) / 2;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(breakXValue, startY);
    context.lineTo(breakXValue, cursorY);
    context.lineTo(cursorX, cursorY);
    return context.toString();
  });

  return <AnimatedPath stroke-width={3} d={path()} />;
};

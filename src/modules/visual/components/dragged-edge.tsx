import * as d3 from "d3";
import { createMemo, Show, type Component } from "solid-js";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { AnimatedPath } from "../ui/animated-path";

const DraggedEdgeWithTask: Component = () => {
  const [edgeDragState] = useEdgeDragStateContext();
  const [transform] = useBoardTransformContext();

  const path = createMemo(() => {
    const transformValue = transform();

    const cursorX = translateX(transformValue, edgeDragState.cursor.x);
    const cursorY = translateY(transformValue, edgeDragState.cursor.y);
    const startX = translateX(transformValue, edgeDragState.start.x);
    const startY = translateY(transformValue, edgeDragState.start.y);

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

export const DraggedEdge: Component = () => {
  const [edgeDragState] = useEdgeDragStateContext();

  return (
    <Show when={edgeDragState.isDragging && edgeDragState.hasPosition}>
      <DraggedEdgeWithTask />
    </Show>
  );
};

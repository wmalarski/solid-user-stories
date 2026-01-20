import * as d3 from "d3";
import { createMemo, createSignal, Show, type Component } from "solid-js";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useDrag } from "../contexts/drag-state";
import { useIsEdgeSelected } from "../contexts/selection-state";
import {
  EDGE_HANDLE_SIZE,
  EDGE_HANDLE_SIZE_HALF,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
} from "../utils/constants";

type EdgePathProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const isSelected = useIsEdgeSelected(() => props.edge.id);

  const path = createMemo(() => {
    const startX = props.source.positionX + TASK_RECT_WIDTH;
    const endX = props.target.positionX;

    const startY = props.source.positionY + TASK_RECT_HEIGHT_HALF;
    const endY = props.target.positionY + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(props.edge.breakX, startY);
    context.lineTo(props.edge.breakX, endY);
    context.lineTo(endX, endY);
    return context.toString();
  });

  return (
    <>
      <path
        d={path()}
        stroke-width={isSelected() ? 3 : 2}
        fill="transparent"
        class="stroke-base-content"
        marker-end="url(#arrow)"
      />
      <Show when={isSelected()}>
        <EdgeHandle edge={props.edge} source={props.source} target={props.target} />
      </Show>
    </>
  );
};

type EdgeHandleProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

const EdgeHandle: Component<EdgeHandleProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  useDrag({
    onDragged(event) {
      edgeCollection.update(props.edge.id, (draft) => {
        draft.breakX = event.x;
      });
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      x={props.edge.breakX - EDGE_HANDLE_SIZE_HALF}
      y={
        (props.source.positionY + props.target.positionY) / 2 +
        TASK_RECT_HEIGHT_HALF -
        EDGE_HANDLE_SIZE_HALF
      }
      width={EDGE_HANDLE_SIZE}
      height={EDGE_HANDLE_SIZE}
      class="fill-base-content"
    />
  );
};

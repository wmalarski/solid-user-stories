import * as d3 from "d3";
import { createMemo, createSignal, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import {
  EDGE_HANDLE_SIZE,
  EDGE_HANDLE_SIZE_HALF,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { createD3DragElement } from "../utils/create-d3-drag-element";

type EdgePathProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const [ref, setRef] = createSignal<SVGElement>();

  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  const isSelected = useIsSelected(() => props.edge.id);

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

  createD3ClickListener({
    onClick() {
      onSelectionChange({ id: props.edge.id, kind: "edge" });
    },
    ref,
  });

  return (
    <>
      <path
        ref={setRef}
        d={path()}
        fill="none"
        class={cx({
          "stroke-accent opacity-5": isSelected(),
          "stroke-transparent": !isSelected(),
        })}
        filter="url(#task-shadow)"
        stroke-width={16}
      />
      <path
        d={path()}
        fill="none"
        class="stroke-accent"
        marker-end="url(#arrow)"
        stroke-width={2}
        stroke-dasharray="5,5"
        stroke-opacity={0.7}
        stroke-dashoffset={0}
      >
        <animate
          attributeName="stroke-dashoffset"
          values="10;0"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
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

  createD3DragElement({
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
      class="fill-accent"
    />
  );
};

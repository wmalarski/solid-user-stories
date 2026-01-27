import * as d3 from "d3";
import { createMemo, createSignal, Show, type Accessor, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeEntry } from "../contexts/board-state";
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
  entry: EdgeEntry;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const [ref, setRef] = createSignal<SVGElement>();

  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  const isSelected = useIsSelected(() => props.entry.edge.id);

  const path = createEdgePath(() => props.entry);

  createD3ClickListener({
    onClick() {
      onSelectionChange({ id: props.entry.edge.id, kind: "edge" });
    },
    ref,
  });

  return (
    <>
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
      <Show when={isSelected()}>
        <EdgeHandle entry={props.entry} />
      </Show>
    </>
  );
};

type ExportableEdgePathProps = {
  entry: EdgeEntry;
};

export const ExportableEdgePath: Component<ExportableEdgePathProps> = (props) => {
  const path = createEdgePath(() => props.entry);

  return <path d={path()} fill="none" class="stroke-accent" stroke-width={2} />;
};

export const createEdgePath = (entry: Accessor<EdgeEntry>) => {
  return createMemo(() => {
    const value = entry();

    const startX = value.source.positionX + TASK_RECT_WIDTH;
    const endX = value.target.positionX;

    const startY = value.source.positionY + TASK_RECT_HEIGHT_HALF;
    const endY = value.target.positionY + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(value.edge.breakX, startY);
    context.lineTo(value.edge.breakX, endY);
    context.lineTo(endX, endY);
    return context.toString();
  });
};

type EdgeHandleProps = {
  entry: EdgeEntry;
};

const EdgeHandle: Component<EdgeHandleProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  createD3DragElement({
    onDragged(event) {
      edgeCollection.update(props.entry.edge.id, (draft) => {
        draft.breakX = event.x;
      });
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      x={props.entry.edge.breakX - EDGE_HANDLE_SIZE_HALF}
      y={
        (props.entry.source.positionY + props.entry.target.positionY) / 2 +
        TASK_RECT_HEIGHT_HALF -
        EDGE_HANDLE_SIZE_HALF
      }
      width={EDGE_HANDLE_SIZE}
      height={EDGE_HANDLE_SIZE}
      class="fill-accent"
    />
  );
};

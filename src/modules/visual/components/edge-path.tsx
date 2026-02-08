import * as d3 from "d3";
import { createMemo, createSignal, Show, type Accessor, type Component } from "solid-js";
import type { EdgeModel, TaskModel } from "../contexts/board-model";
import { useBoardStateContext } from "../contexts/board-state";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import { AnimatedPath } from "../ui/animated-path";
import { HandleRect } from "../ui/handle-rect";
import { SelectablePath } from "../ui/selectable-path";
import { SimplePath } from "../ui/simple-path";
import {
  EDGE_HANDLE_SIZE,
  EDGE_HANDLE_SIZE_HALF,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { createD3DragElement } from "../utils/create-d3-drag-element";

type EdgeEntry = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

type EdgePathProps = {
  edge: EdgeModel;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const entry = createEntryResource(() => props.edge);

  return <Show when={entry()}>{(entry) => <EdgeContainer entry={entry()} />}</Show>;
};

const createEntryResource = (edge: Accessor<EdgeModel>) => {
  const boardState = useBoardStateContext();

  const entry = createMemo((): EdgeEntry | null => {
    const edgeValue = edge();
    const source = boardState.store.tasks.find((task) => task.id === edgeValue.source);
    const target = boardState.store.tasks.find((task) => task.id === edgeValue.target);
    return edgeValue && source && target
      ? { edge: edgeValue, source: source, target: target }
      : null;
  });

  return entry;
};

type EdgeContainerProps = {
  entry: EdgeEntry;
};

const EdgeContainer: Component<EdgeContainerProps> = (props) => {
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
      <AnimatedPath d={path()} stroke-width={2} stroke-opacity={0.7} />
      <SelectablePath ref={setRef} d={path()} isSelected={isSelected()} />
      <Show when={isSelected()}>
        <EdgeHandle entry={props.entry} />
      </Show>
    </>
  );
};

type ExportableEdgePathProps = {
  edge: EdgeModel;
};

export const ExportableEdgePath: Component<ExportableEdgePathProps> = (props) => {
  const entry = createEntryResource(() => props.edge);

  return (
    <Show when={entry()}>
      {(entry) => {
        const path = createEdgePath(() => entry());
        return <SimplePath d={path()} />;
      }}
    </Show>
  );
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
  const boardState = useBoardStateContext();

  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  createD3DragElement({
    onDragged(event) {
      boardState.updateEdgePosition({
        breakX: event.x,
        id: props.entry.edge.id,
      });
    },
    ref: rectRef,
  });

  return (
    <HandleRect
      ref={setRectRef}
      x={props.entry.edge.breakX - EDGE_HANDLE_SIZE_HALF}
      y={
        (props.entry.source.positionY + props.entry.target.positionY) / 2 +
        TASK_RECT_HEIGHT_HALF -
        EDGE_HANDLE_SIZE_HALF
      }
      width={EDGE_HANDLE_SIZE}
      height={EDGE_HANDLE_SIZE}
    />
  );
};

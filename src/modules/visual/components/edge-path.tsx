import * as d3 from "d3";
import { createMemo, createSignal, Show, type Accessor, type Component } from "solid-js";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import {
  EdgeSchema,
  TaskSchema,
  type EdgeBreakInstance,
  type TaskPositionInstance,
} from "~/integrations/jazz/schema";
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
import { updateEdge } from "../utils/edge-actions";

type EdgeEntry = {
  edge: EdgeBreakInstance;
  source: TaskPositionInstance;
  target: TaskPositionInstance;
};

type EdgePathProps = {
  edgeId: string;
  targetId: string;
  sourceId: string;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const entry = createEntryResource(
    () => props.edgeId,
    () => props.sourceId,
    () => props.targetId,
  );

  return <Show when={entry()}>{(entry) => <EdgeContainer entry={entry()} />}</Show>;
};

const createEntryResource = (
  edgeId: Accessor<string>,
  sourceId: Accessor<string>,
  targetId: Accessor<string>,
) => {
  const edge = createJazzResource(() => ({
    id: edgeId(),
    schema: EdgeSchema,
  }));
  const source = createJazzResource(() => ({
    id: sourceId(),
    schema: TaskSchema,
  }));
  const target = createJazzResource(() => ({
    id: targetId(),
    schema: TaskSchema,
  }));

  const entry = createMemo((): EdgeEntry | null => {
    const edgeValue = edge();
    const sourceValue = source();
    const targetValue = target();
    return edgeValue && sourceValue && targetValue
      ? { edge: edgeValue.breakX, source: sourceValue.position, target: targetValue.position }
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

  const isSelected = useIsSelected(() => props.entry.edge.$jazz.id);

  const path = createEdgePath(() => props.entry);

  createD3ClickListener({
    onClick() {
      onSelectionChange({ id: props.entry.edge.$jazz.id, kind: "edge" });
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
  edgeId: string;
  targetId: string;
  sourceId: string;
};

export const ExportableEdgePath: Component<ExportableEdgePathProps> = (props) => {
  const entry = createEntryResource(
    () => props.edgeId,
    () => props.sourceId,
    () => props.targetId,
  );

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

    const startX = value.source.x + TASK_RECT_WIDTH;
    const endX = value.target.x;

    const startY = value.source.y + TASK_RECT_HEIGHT_HALF;
    const endY = value.target.y + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(value.edge.value, startY);
    context.lineTo(value.edge.value, endY);
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
      updateEdge(props.entry.edge, { value: event.x });
    },
    ref: rectRef,
  });

  return (
    <HandleRect
      ref={setRectRef}
      x={props.entry.edge.value - EDGE_HANDLE_SIZE_HALF}
      y={
        (props.entry.source.y + props.entry.target.y) / 2 +
        TASK_RECT_HEIGHT_HALF -
        EDGE_HANDLE_SIZE_HALF
      }
      width={EDGE_HANDLE_SIZE}
      height={EDGE_HANDLE_SIZE}
    />
  );
};

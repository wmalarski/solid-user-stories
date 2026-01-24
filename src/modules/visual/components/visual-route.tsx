import { useParams } from "@solidjs/router";
import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, createSignal, For, Show, Suspense, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardStateProvider, useBoardStateContext } from "../contexts/board-state";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgeDragStateProvider } from "../contexts/edge-drag-state";
import { SelectionStateProvider, useSelectionStateContext } from "../contexts/selection-state";
import { ToolsStateProvider } from "../contexts/tools-state";
import { SVG_CLASS } from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { AxisGridPaths, AxisGridStaticPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { DraggedEdge } from "./dragged-edge";
import { EdgePath } from "./edge-path";
import { InsertTaskDialog } from "./task-dialogs";
import { TaskGroup } from "./task-group";
import { ToolsBar, ZoomBar } from "./tools-bar";

export const VisualRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId ?? "");

  const board = useLiveQuery((q) =>
    q
      .from({ board: boardsCollection })
      .where(({ board }) => eq(board.id, boardId()))
      .findOne(),
  );

  return (
    <Suspense fallback={"Loading..."}>
      <Show when={board().at(0)} fallback={"No board..."}>
        {(board) => <VisualPanel board={board()} />}
      </Show>
    </Suspense>
  );
};

type VisualPanelProps = {
  board: BoardModel;
};

export const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardStateProvider board={props.board}>
      <AxisConfigProvider>
        <ToolsStateProvider>
          <DragStateProvider>
            <SelectionStateProvider>
              <BoardTransformProvider>
                <EdgeDragStateProvider>
                  <BoardContent />
                </EdgeDragStateProvider>
              </BoardTransformProvider>
            </SelectionStateProvider>
          </DragStateProvider>
        </ToolsStateProvider>
      </AxisConfigProvider>
    </BoardStateProvider>
  );
};

const BoardContent: Component = () => {
  return (
    <>
      <svg class={cx("w-screen h-screen z-10 isolate", SVG_CLASS)}>
        <SvgDefinitions />
        <BackgroundRect />
        <AxisGridStaticPaths />
        <SelectableGroup />
        <DraggedEdge />
        <AxisGroup />
      </svg>
      <ToolsBar />
      <ZoomBar />
      <InsertTaskDialog />
    </>
  );
};

const SelectableGroup: Component = () => {
  const boardState = useBoardStateContext();

  const [isDragging] = useDragStateContext();
  const [transform] = useBoardTransformContext();

  return (
    <g cursor={isDragging() ? "grabbing" : "grab"}>
      <AxisGridPaths />
      <g transform={transform() as unknown as string}>
        <For each={boardState.edges()}>
          {(entry) => <EdgePath edge={entry.edge} source={entry.source} target={entry.target} />}
        </For>
        <For each={boardState.tasks()}>{(task) => <TaskGroup task={task} />}</For>
      </g>
    </g>
  );
};

const BackgroundRect: Component = () => {
  const [rectRef, setRectRef] = createSignal<SVGElement>();

  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  createD3ClickListener({
    onClick() {
      onSelectionChange(null);
    },
    ref: rectRef,
  });

  return <rect ref={setRectRef} x={0} y={0} width="100%" height="100%" fill="transparent" />;
};

const SvgDefinitions: Component = () => {
  return (
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path class="fill-accent" d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
      <filter id="task-shadow" width="50" height="50">
        <feOffset in="SourceAlpha" dx="3" dy="3" />
        <feGaussianBlur stdDeviation="10" />
        <feBlend in="SourceGraphic" in2="blurOut" />
      </filter>
    </defs>
  );
};

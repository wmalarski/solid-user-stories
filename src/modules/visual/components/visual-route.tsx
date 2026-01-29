import { useParams } from "@solidjs/router";
import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, createSignal, For, Show, Suspense, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { BoardStateProvider, getBoardBox, useBoardStateContext } from "../contexts/board-state";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgeDragStateProvider } from "../contexts/edge-drag-state";
import { ExportStateProvider, useExportStateContext } from "../contexts/export-state";
import { SectionConfigsProvider, useSectionConfigsContext } from "../contexts/section-configs";
import { SelectionStateProvider, useSelectionStateContext } from "../contexts/selection-state";
import { ToolsStateProvider } from "../contexts/tools-state";
import { SVG_CLASS, SVG_EXPORT_CLASS } from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { DraggedEdge } from "./dragged-edge";
import { EdgePath, ExportableEdgePath } from "./edge-path";
import {
  ExportableSectionGridPaths,
  SectionGridPaths,
  SectionGridStaticPaths,
} from "./section-grid-paths";
import { ExportableSectionItems, SectionItems } from "./section-items";
import { InsertTaskByToolDialog } from "./task-dialogs";
import { ExportableTaskGroup, TaskGroup } from "./task-group";
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

const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardStateProvider board={props.board}>
      <SectionConfigsProvider>
        <ToolsStateProvider>
          <DragStateProvider>
            <SelectionStateProvider>
              <BoardTransformProvider>
                <EdgeDragStateProvider>
                  <ExportStateProvider>
                    <BoardContent />
                  </ExportStateProvider>
                </EdgeDragStateProvider>
              </BoardTransformProvider>
            </SelectionStateProvider>
          </DragStateProvider>
        </ToolsStateProvider>
      </SectionConfigsProvider>
    </BoardStateProvider>
  );
};

const BoardContent: Component = () => {
  return (
    <>
      <svg class={cx("w-screen h-screen z-10 isolate", SVG_CLASS)}>
        <SvgDefinitions />
        <BackgroundRect />
        <SectionGridStaticPaths />
        <SelectableGroup />
        <DraggedEdge />
        <SectionItems />
      </svg>
      <ToolsBar />
      <ZoomBar />
      <InsertTaskByToolDialog />
      <ExportableBoard />
    </>
  );
};

const SelectableGroup: Component = () => {
  const boardState = useBoardStateContext();

  const [isDragging] = useDragStateContext();
  const [transform] = useBoardTransformContext();

  return (
    <g cursor={isDragging() ? "grabbing" : "grab"}>
      <SectionGridPaths />
      <g transform={transform() as unknown as string}>
        <For each={boardState.edges()}>{(entry) => <EdgePath entry={entry} />}</For>
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

  return <rect ref={setRectRef} x={0} y={0} width="100%" height="100%" class="fill-base-100" />;
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
      <filter id="dropshadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="2" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.2" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
};

const ExportableBoard: Component = () => {
  const boardState = useBoardStateContext();
  const sectionConfigs = useSectionConfigsContext();

  const [exportState] = useExportStateContext();

  const boardBox = createMemo(() =>
    getBoardBox({
      edges: boardState.edges(),
      sections: sectionConfigs(),
      tasks: boardState.tasks(),
    }),
  );

  return (
    <Show when={exportState()}>
      <svg
        width={boardBox().width}
        height={boardBox().height}
        id={SVG_EXPORT_CLASS}
        class="bg-base-100"
      >
        <ExportableSectionGridPaths />
        <For each={boardState.tasks()}>{(task) => <ExportableTaskGroup task={task} />}</For>
        <For each={boardState.edges()}>{(entry) => <ExportableEdgePath entry={entry} />}</For>
        <ExportableSectionItems />
      </svg>
    </Show>
  );
};

import { useParams } from "@solidjs/router";
import { createMemo, createSignal, For, Show, Suspense, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import { BoardSchema, type BoardInstance } from "~/integrations/jazz/schema";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgeDragStateProvider } from "../contexts/edge-drag-state";
import { ExportStateProvider, useExportStateContext } from "../contexts/export-state";
import { SelectionStateProvider, useSelectionStateContext } from "../contexts/selection-state";
import { ToolsStateProvider } from "../contexts/tools-state";
import { BoardStateProvider, useBoardStateContext } from "../state/board-state";
import { getBoardBox } from "../state/get-board-box";
import { SVG_CLASS, SVG_EXPORT_CLASS } from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { CursorPaths } from "./cursor-paths";
import { DraggedEdge } from "./dragged-edge";
import { EdgePath, ExportableEdgePath } from "./edge-path";
import {
  ExportableSectionGridPaths,
  SectionGridPaths,
  SectionGridStaticPaths,
} from "./section-grid-paths";
import { ExportableSectionItems, SectionItems } from "./section-items";
import { SnapLines } from "./snap-lines";
import { InsertTaskByToolDialog } from "./task-dialogs";
import { ExportableTaskGroup, TaskGroup } from "./task-group";
import { InfoBar, PresenceBar, ToolsBar, ZoomBar } from "./tools-bar";

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

  const [exportState] = useExportStateContext();

  const boardBox = createMemo(() =>
    getBoardBox({
      edges: boardState.store.edges,
      sectionsX: boardState.sectionXConfigs(),
      sectionsY: boardState.sectionYConfigs(),
      tasks: boardState.store.tasks,
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
        <For each={boardState.store.tasks}>{(task) => <ExportableTaskGroup task={task} />}</For>
        <For each={boardState.store.edges}>{(edge) => <ExportableEdgePath edge={edge} />}</For>
        <ExportableSectionItems />
      </svg>
    </Show>
  );
};

const SelectableGroup: Component = () => {
  const boardState = useBoardStateContext();

  const [isDragging] = useDragStateContext();
  const [transform] = useBoardTransformContext();

  return (
    <g cursor={isDragging() ? "grabbing" : "grab"}>
      <SectionGridPaths />
      {/* oxlint-disable-next-line typescript/no-unsafe-type-assertion */}
      <g transform={transform() as unknown as string}>
        <For each={boardState.store.edges}>{(edge) => <EdgePath edge={edge} />}</For>
        <For each={boardState.store.tasks}>{(task) => <TaskGroup task={task} />}</For>
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

const BoardContent: Component = () => {
  return (
    <>
      <svg class={cx("w-screen h-screen z-10 isolate", SVG_CLASS)}>
        <SvgDefinitions />
        <BackgroundRect />
        <SectionGridStaticPaths />
        <SnapLines />
        <SelectableGroup />
        <DraggedEdge />
        <CursorPaths />
        <SectionItems />
      </svg>
      <PresenceBar />
      <ToolsBar />
      <ZoomBar />
      <InfoBar />
      <InsertTaskByToolDialog />
      <ExportableBoard />
    </>
  );
};

type VisualPanelProps = {
  board: BoardInstance;
};

const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardStateProvider board={props.board}>
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
    </BoardStateProvider>
  );
};

export const VisualRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId ?? "");

  const [board] = createJazzResource(() => ({
    id: boardId(),
    schema: BoardSchema,
  }));

  return (
    <Suspense fallback={"Loading..."}>
      <Show when={board()} fallback={"No board..."}>
        {(value) => <VisualPanel board={value()} />}
      </Show>
    </Suspense>
  );
};

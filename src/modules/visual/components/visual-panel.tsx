import { createSignal, For, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgesDataProvider, useEdgesDataContext } from "../contexts/edges-data";
import { SelectionStateProvider, useSelectionStateContext } from "../contexts/selection-state";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { ToolsStateProvider } from "../contexts/tools-state";
import { SVG_CLASS } from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { AxisGridPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { EdgePath } from "./edge-path";
import { InsertTaskDialog } from "./task-dialogs";
import { TaskGroup } from "./task-group";
import { ToolsBar } from "./tools-bar";
import { ZoomBar } from "./zoom-bar";

type VisualPanelProps = {
  board: BoardModel;
};

export const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardModelProvider board={props.board}>
      <TasksDataProvider>
        <EdgesDataProvider>
          <AxisConfigProvider>
            <ToolsStateProvider>
              <DragStateProvider>
                <SelectionStateProvider>
                  <BoardTransformProvider>
                    <BoardContent />
                  </BoardTransformProvider>
                </SelectionStateProvider>
              </DragStateProvider>
            </ToolsStateProvider>
          </AxisConfigProvider>
        </EdgesDataProvider>
      </TasksDataProvider>
    </BoardModelProvider>
  );
};

const BoardContent: Component = () => {
  return (
    <>
      <svg class={cx("w-screen h-screen z-10 isolate", SVG_CLASS)}>
        <SvgDefinitions />
        <BackgroundRect />
        <AxisGridPaths />
        <SelectableGroup />
        <AxisGroup />
      </svg>
      <ToolsBar />
      <ZoomBar />
      <InsertTaskDialog />
    </>
  );
};

const SelectableGroup: Component = () => {
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const dragState = useDragStateContext();

  return (
    <g
      cursor={dragState().isDragging() ? "grabbing" : "grab"}
      transform={boardTransformContext().transform as unknown as string}
    >
      <For each={edgesData().entries}>
        {(entry) => <EdgePath edge={entry.edge} source={entry.source} target={entry.target} />}
      </For>
      <For each={tasksData().entries}>{(task) => <TaskGroup task={task} />}</For>
    </g>
  );
};

const BackgroundRect: Component = () => {
  const [rectRef, setRectRef] = createSignal<SVGElement>();
  const selectionState = useSelectionStateContext();

  createD3ClickListener({
    onClick() {
      selectionState().setSelection(null);
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

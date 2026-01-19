import { For, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardDialogsProvider } from "../contexts/board-dialogs";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgesDataProvider, useEdgesDataContext } from "../contexts/edges-data";
import { SelectionStateProvider } from "../contexts/selection-state";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { ToolsStateProvider } from "../contexts/tools-state";
import { SELECTABLE_GROUP_CLASS, SVG_CLASS } from "../utils/constants";
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
    <BoardThemeProvider>
      <BoardModelProvider board={props.board}>
        <TasksDataProvider>
          <EdgesDataProvider>
            <AxisConfigProvider>
              <ToolsStateProvider>
                <DragStateProvider>
                  <DragAndDropExample />
                </DragStateProvider>
              </ToolsStateProvider>
            </AxisConfigProvider>
          </EdgesDataProvider>
        </TasksDataProvider>
      </BoardModelProvider>
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  return (
    <SelectionStateProvider>
      <BoardTransformProvider>
        <BoardDialogsProvider>
          <svg class={cx("w-screen h-screen z-10 isolate", SVG_CLASS)}>
            <AxisGridPaths />
            <SelectableGroup />
            <AxisGroup />
          </svg>
          <ToolsBar />
          <ZoomBar />
          <InsertTaskDialog />
        </BoardDialogsProvider>
      </BoardTransformProvider>
    </SelectionStateProvider>
  );
};

const SelectableGroup: Component = () => {
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const dragState = useDragStateContext();

  return (
    <g
      class={SELECTABLE_GROUP_CLASS}
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

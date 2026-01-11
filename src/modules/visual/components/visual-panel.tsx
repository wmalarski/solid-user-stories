import { createSignal, For, type Component } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgesDataProvider, useEdgesDataContext } from "../contexts/edges-data";
import { SelectionStateProvider } from "../contexts/selection-state";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { AxisGridPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { EdgePath } from "./edge-path";
import { TaskContent, TaskGroup } from "./task-group";
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
              <DragStateProvider>
                <SelectionStateProvider>
                  <DragAndDropExample />
                </SelectionStateProvider>
              </DragStateProvider>
            </AxisConfigProvider>
          </EdgesDataProvider>
        </TasksDataProvider>
      </BoardModelProvider>
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();

  return (
    <BoardTransformProvider svg={svgRef()}>
      <svg ref={setSvgRef} class="w-screen h-screen">
        <AxisGridPaths />
        <SelectableGroup />
        <TaskContentGroup />
        <AxisGroup />
      </svg>
      <ZoomBar />
    </BoardTransformProvider>
  );
};

const SelectableGroup: Component = () => {
  const [_groupRef, setGroupRef] = createSignal<SVGElement>();
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const dragState = useDragStateContext();

  return (
    <g
      ref={setGroupRef}
      cursor={dragState().isDragging() ? "grabbing" : "grab"}
      transform={boardTransformContext().transform() as unknown as string}
    >
      <For each={edgesData().entries}>
        {(entry) => <EdgePath edge={entry.edge} source={entry.source} target={entry.target} />}
      </For>
      <For each={tasksData().entries}>{(task) => <TaskGroup task={task} />}</For>
    </g>
  );
};

const TaskContentGroup: Component = () => {
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const dragState = useDragStateContext();

  return (
    <g
      cursor={dragState().isDragging() ? "grabbing" : "grab"}
      transform={boardTransformContext().transform() as unknown as string}
    >
      <For each={tasksData().entries}>{(task) => <TaskContent task={task} />}</For>
    </g>
  );
};

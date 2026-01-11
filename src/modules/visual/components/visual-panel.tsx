import { createSignal, For, type Component } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgesDataProvider, useEdgesDataContext } from "../contexts/edges-data";
import { SelectionStateProvider, useSelection } from "../contexts/selection-state";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { AxisGridPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { EdgePath } from "./edge-path";
import { TaskGroup } from "./task-group";

type VisualPanelProps = {
  board: BoardModel;
};

export const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardThemeProvider>
      <BoardTransformProvider>
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
      </BoardTransformProvider>
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const dragState = useDragStateContext();

  useSelection({ ref: svgRef });
  // useZoomTransform({ ref: svgRef });

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <AxisGridPaths />
      <g
        cursor={dragState().isDragging() ? "grabbing" : "grab"}
        transform={boardTransformContext().transform() as unknown as string}
      >
        <For each={edgesData().entries}>
          {(entry) => <EdgePath edge={entry.edge} source={entry.source} target={entry.target} />}
        </For>
        <For each={tasksData().entries}>{(task) => <TaskGroup task={task} />}</For>
      </g>
      <AxisGroup />
    </svg>
  );
};

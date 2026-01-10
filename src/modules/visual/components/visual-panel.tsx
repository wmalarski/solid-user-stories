import { createSignal, For, type Component } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { useZoomTransform } from "../utils/use-zoom-transform";
import { AxisGridPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { DragGroup } from "./drag-group";
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
            <AxisConfigProvider>
              <DragAndDropExample />
            </AxisConfigProvider>
          </TasksDataProvider>
        </BoardModelProvider>
      </BoardTransformProvider>
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();
  const boardTransformContext = useBoardTransformContext();

  useZoomTransform({ ref: svgRef });

  const tasksData = useTasksDataContext();

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <AxisGridPaths />
      <DragGroup transform={boardTransformContext().transform() as unknown as string}>
        <For each={tasksData().entries}>{(task) => <TaskGroup task={task} />}</For>
      </DragGroup>
      <AxisGroup />
    </svg>
  );
};

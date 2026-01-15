import * as d3 from "d3";
import { createEffect, createSignal, For, onCleanup, type Component } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { DragStateProvider, useDragStateContext } from "../contexts/drag-state";
import { EdgesDataProvider, useEdgesDataContext } from "../contexts/edges-data";
import { SelectionStateProvider } from "../contexts/selection-state";
import { TasksDataProvider, useTasksDataContext } from "../contexts/tasks-data";
import { ToolsStateProvider, useToolsStateContext } from "../contexts/tools-state";
import { AxisGridPaths } from "./axis-grid-paths";
import { AxisGroup } from "./axis-group";
import { EdgePath } from "./edge-path";
import { TaskContent, TaskGroup } from "./task-group";
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
              <DragStateProvider>
                <ToolsStateProvider>
                  <DragAndDropExample />
                </ToolsStateProvider>
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
  const [selectableRef, setSelectableRef] = createSignal<SVGElement>();

  return (
    <SelectionStateProvider ref={selectableRef()}>
      <BoardTransformProvider svg={svgRef()}>
        <svg ref={setSvgRef} class="w-screen h-screen z-10 isolate">
          <CreateTaskTool svg={svgRef()} />
          <AxisGridPaths />
          <SelectableGroup ref={setSelectableRef} />
          <TaskContentGroup />
          <AxisGroup />
        </svg>
        <ToolsBar />
        <ZoomBar />
      </BoardTransformProvider>
    </SelectionStateProvider>
  );
};

type SelectableGroupProps = {
  ref: (element: SVGElement) => void;
};

const SelectableGroup: Component<SelectableGroupProps> = (props) => {
  const boardTransformContext = useBoardTransformContext();

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const dragState = useDragStateContext();

  return (
    <g
      ref={props.ref}
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

type CreateTaskToolProps = {
  svg: SVGElement | undefined;
};

const CreateTaskTool: Component<CreateTaskToolProps> = (props) => {
  const toolsState = useToolsStateContext();

  createEffect(() => {
    const isCreateTask = toolsState().tool() === "create-task";
    const svg = props.svg;

    if (!isCreateTask || !svg) {
      return;
    }

    const abortController = new AbortController();
    const select = d3.select(svg);
    select.on(
      "click",
      (event) => {
        console.log("EVENT", event);
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return null;
};

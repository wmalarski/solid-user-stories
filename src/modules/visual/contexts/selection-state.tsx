import * as d3 from "d3";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { SELECTABLE_GROUP_SELECTOR, TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "../utils/constants";
import { useEdgesDataContext } from "./edges-data";
import { useTasksDataContext } from "./tasks-data";
import { useToolsStateContext } from "./tools-state";

type BrushEvent = {
  selection: [[number, number], [number, number]];
};

const createSelectionStateContext = () => {
  const [taskSelection, setTaskSelection] = createSignal<string[]>([]);
  const [edgeSelection, setEdgeSelection] = createSignal<string[]>([]);

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();

  const onSelection = (event: BrushEvent) => {
    const [[startX, startY], [endX, endY]] = event.selection;

    const tasks = tasksData()
      .entries.filter(
        (task) =>
          startX < task.positionX &&
          task.positionX + TASK_RECT_WIDTH < endX &&
          startY < task.positionY &&
          task.positionY + TASK_RECT_HEIGHT < endY,
      )
      .map((task) => task.id);

    const edges = edgesData()
      .entries.filter((entry) => {
        const [edgeStartX, edgeEndX] = [
          entry.source.positionX + TASK_RECT_WIDTH,
          entry.target.positionX,
        ].toSorted((a, b) => a - b);

        const heightOffset = TASK_RECT_HEIGHT / 2;
        const [edgeStartY, edgeEndY] = [
          entry.source.positionY + heightOffset,
          entry.target.positionY + heightOffset,
        ].toSorted((a, b) => a - b);

        return startX < edgeStartX && edgeEndX < endX && startY < edgeStartY && edgeEndY < endY;
      })
      .map((entry) => entry.edge.id);

    setEdgeSelection(edges);
    setTaskSelection(tasks);
  };

  const plugin = d3.brush().on("brush", onSelection);

  return {
    edgeSelection,
    plugin,
    setEdgeSelection,
    setTaskSelection,
    taskSelection,
  };
};

const SelectionStateContext = createContext<
  Accessor<ReturnType<typeof createSelectionStateContext>>
>(() => {
  throw new Error("SelectionStateContext is not defined");
});

export const SelectionStateProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createSelectionStateContext());

  const toolsState = useToolsStateContext();

  createEffect(() => {
    const isSelector = toolsState().tool() === "selector";
    if (!isSelector) {
      return;
    }

    // oxlint-disable-next-line no-explicit-any
    d3.select(SELECTABLE_GROUP_SELECTOR).call(value().plugin as any);

    onCleanup(() => {
      d3.select(SELECTABLE_GROUP_SELECTOR).on(".brush", null);
    });
  });

  return (
    <SelectionStateContext.Provider value={value}>{props.children}</SelectionStateContext.Provider>
  );
};

export const useSelectionStateContext = () => {
  return useContext(SelectionStateContext);
};

export const useIsTaskSelected = (elementId: Accessor<string>) => {
  const context = useSelectionStateContext();
  return createMemo(() => context().taskSelection().includes(elementId()));
};

export const useIsEdgeSelected = (elementId: Accessor<string>) => {
  const context = useSelectionStateContext();
  return createMemo(() => context().edgeSelection().includes(elementId()));
};

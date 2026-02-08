import {
  createContext,
  createMemo,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import {
  EdgesListSchema,
  SectionListSchema,
  TaskListSchema,
  type BoardInstance,
  type SectionInstance,
  type SectionSizeInstance,
  type TaskInput,
} from "~/integrations/jazz/schema";
import { insertEdgeFromPoint, insertEdgeToSecondTask } from "../utils/edge-actions";
import {
  deleteSectionAndShift,
  insertHorizonalSectionAndShift,
  insertVerticalSectionAndShift,
  updateHorizontalSectionSize,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import { getSectionConfig, getSectionConfigs, mapToSections } from "../utils/section-configs";
import { deleteTaskWithDependencies } from "../utils/task-actions";

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
  const tasks = createJazzResource(() => ({
    id: board().tasks.$jazz.id,
    schema: TaskListSchema,
  }));

  const taskMap = createMemo(() => new Map(tasks()?.map((task) => [task.$jazz.id, task] as const)));

  const taskPositions = createMemo(
    () => new Map(tasks()?.map((task) => [task.$jazz.id, task.position] as const)),
  );

  const edges = createJazzResource(() => ({
    id: board().edges.$jazz.id,
    schema: EdgesListSchema,
  }));

  const edgePositions = createMemo(
    () => new Map(edges()?.map((edge) => [edge.$jazz.id, edge.breakX] as const)),
  );

  const sectionsX = createJazzResource(() => ({
    id: board().sectionX.$jazz.id,
    schema: SectionListSchema,
  }));

  const sectionsY = createJazzResource(() => ({
    id: board().sectionY.$jazz.id,
    schema: SectionListSchema,
  }));

  const sectionsYSizes = createMemo(
    () => new Map(sectionsY()?.map((edge) => [edge.$jazz.id, edge.size] as const)),
  );

  const sectionConfigs = createMemo(() => getSectionConfigs(sectionsX(), sectionsY()));

  const sectionXConfigs = createMemo(() => getSectionConfig(sectionsX()));
  const sectionYConfigs = createMemo(() => getSectionConfig(sectionsY()));

  const insertTask = (
    input: Pick<TaskInput, "description" | "estimate" | "link" | "title" | "position">,
  ) => {
    const tasksValue = tasks();
    if (!tasksValue) {
      return;
    }

    const sections = mapToSections(sectionXConfigs(), sectionYConfigs(), input.position);
    const size = tasksValue.$jazz.push({
      ...input,
      sectionX: sections.sectionX?.$jazz.id ?? null,
      sectionY: sections.sectionY?.$jazz.id ?? null,
      sourceEdges: [],
      targetEdges: [],
    });
    const taskId = tasksValue[size - 1].$jazz.id;

    if (sections.sectionX) {
      const updated = [...sections.sectionX.tasks, taskId];
      sections.sectionX.$jazz.set("tasks", updated);
    }
    if (sections.sectionY) {
      const updated = [...sections.sectionY.tasks, taskId];
      sections.sectionY.$jazz.set("tasks", updated);
    }
  };

  const insertSection = (
    args: Pick<SectionInstance, "name" | "orientation"> & {
      index: number;
    },
  ) => {
    if (args.orientation === "horizontal") {
      const sectionsXValue = sectionsX();
      if (sectionsXValue) {
        insertHorizonalSectionAndShift({
          edgePositions: edgePositions(),
          index: args.index,
          name: args.name,
          sectionConfigs: sectionXConfigs(),
          sections: sectionsXValue,
          taskPositions: taskPositions(),
        });
      }
    } else {
      const sectionsYValue = sectionsY();
      if (sectionsYValue) {
        insertVerticalSectionAndShift({
          index: args.index,
          name: args.name,
          sectionConfigs: sectionYConfigs(),
          sections: sectionsYValue,
          taskPositions: taskPositions(),
        });
      }
    }
  };

  const updateHorizontalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    startPosition: number;
    sectionStart: number;
    sectionSize: SectionSizeInstance;
  }) => {
    // const sectionSize = sectionsXSizes().get(args.sectionId);

    console.log("[updateHorizontalSectionPosition]", { args });

    updateHorizontalSectionSize({
      taskPositions: taskPositions(),
      ...args,
    });
  };

  const updateVerticalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    draggedEdges: Map<string, number>;
    sectionId: string;
    startPosition: number;
    sectionStart: number;
  }) => {
    const sectionSize = sectionsYSizes().get(args.sectionId);
    if (sectionSize) {
      updateVerticalSectionSize({
        edgePositions: edgePositions(),
        sectionSize,
        taskPositions: taskPositions(),
        ...args,
      });
    }
  };

  const deleteSection = (
    args: Pick<SectionInstance, "orientation"> & {
      endPosition: number;
      shift: number;
      id: string;
    },
  ) => {
    const sectionsYValue = sectionsY();
    const sectionsXValue = sectionsX();
    if (sectionsYValue && sectionsXValue) {
      deleteSectionAndShift({
        edgePositions: edgePositions(),
        endPosition: args.endPosition,
        orientation: args.orientation,
        sectionId: args.id,
        sectionsX: sectionsXValue,
        sectionsY: sectionsYValue,
        shift: args.shift,
        taskPositions: taskPositions(),
      });
    }
  };

  const deleteTask = (taskId: string) => {
    deleteTaskWithDependencies({
      edges: edges(),
      taskId,
      tasks: tasks(),
    });
  };

  const deleteEdge = (edgeId: string) => {
    edges()?.$jazz.remove((edge) => edge.$jazz.id === edgeId);
  };

  const insertEdgeToPoint = (args: { isSource: boolean; taskId: string; x: number; y: number }) => {
    const edgesValue = edges();
    if (edgesValue) {
      return insertEdgeFromPoint({
        edges: edgesValue,
        taskPositions: taskPositions(),
        ...args,
      });
    }
  };

  const insertEdgeToTask = (args: { isSource: boolean; taskId: string; secondTaskId: string }) => {
    const edgesValue = edges();
    const tasksValue = tasks();
    if (edgesValue && tasksValue) {
      return insertEdgeToSecondTask({
        edges: edgesValue,
        taskPositions: taskPositions(),
        tasks: tasksValue,
        ...args,
      });
    }
  };

  return {
    board,
    deleteEdge,
    deleteSection,
    deleteTask,
    edgePositions,
    edges,
    insertEdgeToPoint,
    insertEdgeToTask,
    insertSection,
    insertTask,
    sectionConfigs,
    sectionXConfigs,
    sectionYConfigs,
    sectionsX,
    sectionsY,
    taskMap,
    taskPositions,
    tasks,
    updateHorizontalSectionPosition,
    updateVerticalSectionPosition,
  };
};

const BoardStateContext = createContext<ReturnType<typeof createBoardStateContext> | null>(null);

export const useBoardStateContext = () => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error("BoardStateContext is not defined");
  }
  return context;
};

type BoardStateProviderProps = ParentProps<{
  board: BoardInstance;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};

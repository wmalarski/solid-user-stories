import {
  createContext,
  createEffect,
  createMemo,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import {
  BoardSchema,
  EdgesListSchema,
  SectionListSchema,
  TaskListSchema,
  type BoardInstance,
  type SectionInstance,
  type TaskInput,
} from "~/integrations/jazz/schema";
import { insertEdgeFromPoint, insertEdgeToSecondTask, updateEdge } from "../utils/edge-actions";
import {
  deleteSectionAndShift,
  insertHorizonalSectionAndShift,
  insertVerticalSectionAndShift,
  updateHorizontalSectionSize,
  updateSectionData,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import {
  getSectionConfig,
  getSectionConfig2,
  mapToSections,
  mapToSections2,
} from "../utils/section-configs";
import {
  deleteTaskWithDependencies,
  updateTaskData,
  updateTaskPosition,
  updateTaskSections,
} from "../utils/task-actions";
import {
  mapToBoardModel,
  type BoardModel,
  type EdgeModel,
  type SectionModel,
  type TaskModel,
} from "./board-model";

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
  const tasks = createJazzResource(() => ({
    id: board().tasks.$jazz.id,
    schema: TaskListSchema,
  }));

  const [store, setStore] = createStore<BoardModel>({
    edges: [],
    sectionsX: [],
    sectionsY: [],
    tasks: [],
  });

  const boardId = createMemo(() => board().$jazz.id);
  createEffect(() => {
    const boardIdValue = boardId();
    onCleanup(
      BoardSchema.subscribe(boardIdValue, (value) => {
        setStore(reconcile(mapToBoardModel(value)));
      }),
    );
  });

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

  const sectionsXSizes = createMemo(
    () => new Map(sectionsX()?.map((edge) => [edge.size.$jazz.id, edge.size] as const)),
  );

  const sectionsYSizes = createMemo(
    () => new Map(sectionsY()?.map((edge) => [edge.size.$jazz.id, edge.size] as const)),
  );

  const sectionXConfigs = createMemo(() => getSectionConfig(sectionsX()));
  const sectionYConfigs = createMemo(() => getSectionConfig(sectionsY()));
  const sectionXConfigs2 = createMemo(() => getSectionConfig2(store.sectionsX));
  const sectionYConfigs2 = createMemo(() => getSectionConfig2(store.sectionsY));

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
    sectionSizeId: string;
  }) => {
    const sectionSize = sectionsYSizes().get(args.sectionSizeId);
    if (sectionSize) {
      updateHorizontalSectionSize({
        sectionSize,
        taskPositions: taskPositions(),
        ...args,
      });
    }
  };

  const updateVerticalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    draggedEdges: Map<string, number>;
    sectionSizeId: string;
    startPosition: number;
    sectionStart: number;
  }) => {
    const sectionSize = sectionsXSizes().get(args.sectionSizeId);
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

  const updateEdgePosition = (edge: Pick<EdgeModel, "positionId" | "breakX">) => {
    const edgePosition = edgePositions().get(edge.positionId);
    if (edgePosition) {
      updateEdge(edgePosition, { value: edge.breakX });
    }
  };

  const updateSectionName = (args: Pick<SectionModel, "id" | "name" | "orientation">) => {
    const sections = args.orientation === "horizontal" ? sectionsX() : sectionsY();
    const section = sections?.find((section) => section.$jazz.id === args.id);

    if (section) {
      updateSectionData(section, {
        name: args.name,
      });
    }
  };

  const updateTaskModel = (
    args: Pick<TaskModel, "id" | "description" | "estimate" | "link" | "title">,
  ) => {
    const task = taskMap().get(args.id);

    if (task) {
      updateTaskData(task, {
        description: args.description,
        estimate: args.estimate,
        link: args.link,
        title: args.title,
      });
    }
  };

  const updateTask = (args: Pick<TaskModel, "id" | "position" | "positionId">) => {
    const task = taskMap().get(args.id);
    const taskPosition = taskPositions().get(args.positionId);

    if (task && taskPosition) {
      const sectionIds = mapToSections2(sectionXConfigs2(), sectionYConfigs2(), args.position);
      updateTaskPosition(taskPosition, args.position);
      updateTaskSections(task, {
        sectionX: sectionIds.sectionX?.id ?? null,
        sectionY: sectionIds.sectionY?.id ?? null,
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
    sectionXConfigs,
    sectionXConfigs2,
    sectionYConfigs,
    sectionYConfigs2,
    sectionsX,
    sectionsY,
    store,
    taskMap,
    taskPositions,
    tasks,
    updateEdgePosition,
    updateHorizontalSectionPosition,
    updateSectionName,
    updateTask,
    updateTaskModel,
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

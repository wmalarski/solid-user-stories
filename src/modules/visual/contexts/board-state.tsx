import { getLoadedOrUndefined } from "jazz-tools";
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
import { BoardSchema, type BoardInstance, type SectionInstance } from "~/integrations/jazz/schema";
import { insertEdgeFromPoint, insertEdgeToSecondTask, updateEdge } from "../utils/edge-actions";
import {
  deleteSectionAndShift,
  insertHorizonalSectionAndShift,
  insertVerticalSectionAndShift,
  updateHorizontalSectionSize,
  updateSectionData,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import { getSectionConfig, mapToSections } from "../utils/section-configs";
import {
  deleteTaskWithDependencies,
  updateTaskData,
  updateTaskPosition,
} from "../utils/task-actions";
import {
  mapToBoardModel,
  type BoardModel,
  type EdgeModel,
  type SectionModel,
  type TaskModel,
} from "./board-model";

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
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

  const sectionXConfigs = createMemo(() => getSectionConfig(store.sectionsX));
  const sectionYConfigs = createMemo(() => getSectionConfig(store.sectionsY));

  const insertTask = (
    input: Pick<TaskModel, "description" | "estimate" | "link" | "title" | "position">,
  ) => {
    const tasksValue = getLoadedOrUndefined(board().tasks);
    if (!tasksValue) {
      return;
    }

    const sections = mapToSections(sectionXConfigs(), sectionYConfigs(), input.position);
    tasksValue.$jazz.push({
      description: input.description,
      estimate: input.estimate,
      link: input.link,
      positionX: input.position.x,
      positionY: input.position.y,
      sectionX: sections.sectionX?.id ?? null,
      sectionY: sections.sectionY?.id ?? null,
      sourceEdges: [],
      targetEdges: [],
      title: input.title,
    });
  };

  const insertSection = (
    args: Pick<SectionInstance, "name" | "orientation"> & {
      index: number;
    },
  ) => {
    if (args.orientation === "horizontal") {
      insertHorizonalSectionAndShift({
        board: board(),
        index: args.index,
        name: args.name,
        sectionConfigs: sectionXConfigs(),
      });
    } else {
      insertVerticalSectionAndShift({
        board: board(),
        index: args.index,
        name: args.name,
        sectionConfigs: sectionYConfigs(),
      });
    }
  };

  const updateHorizontalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    startPosition: number;
    sectionStart: number;
    sectionSizeId: string;
  }) => {
    updateHorizontalSectionSize({
      board: board(),
      sectionId: args.sectionSizeId,
      ...args,
    });
  };

  const updateVerticalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    draggedEdges: Map<string, number>;
    sectionSizeId: string;
    startPosition: number;
    sectionStart: number;
  }) => {
    updateVerticalSectionSize({
      board: board(),
      sectionId: args.sectionSizeId,
      ...args,
    });
  };

  const deleteSection = (
    args: Pick<SectionInstance, "orientation"> & {
      endPosition: number;
      shift: number;
      id: string;
    },
  ) => {
    deleteSectionAndShift({
      board: board(),
      endPosition: args.endPosition,
      orientation: args.orientation,
      sectionId: args.id,
      shift: args.shift,
    });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskWithDependencies({ board: board(), taskId });
  };

  const deleteEdge = (edgeId: string) => {
    getLoadedOrUndefined(board().edges)?.$jazz.remove((edge) => edge.$jazz.id === edgeId);
  };

  const insertEdgeToPoint = (args: { isSource: boolean; taskId: string; x: number; y: number }) => {
    return insertEdgeFromPoint({
      board: board(),
      ...args,
    });
  };

  const insertEdgeToTask = (args: { isSource: boolean; taskId: string; secondTaskId: string }) => {
    return insertEdgeToSecondTask({
      board: board(),
      ...args,
    });
  };

  const updateEdgePosition = (edge: Pick<EdgeModel, "id" | "breakX">) => {
    updateEdge({ board: board(), breakX: edge.breakX, edgeId: edge.id });
  };

  const updateSectionName = (args: Pick<SectionModel, "id" | "name" | "orientation">) => {
    updateSectionData({
      board: board(),
      id: args.id,
      name: args.name,
      orientation: args.orientation,
    });
  };

  const updateTaskModel = (
    args: Pick<TaskModel, "id" | "description" | "estimate" | "link" | "title">,
  ) => {
    updateTaskData({
      board: board(),
      description: args.description,
      estimate: args.estimate,
      link: args.link,
      taskId: args.id,
      title: args.title,
    });
  };

  const updateTask = (args: Pick<TaskModel, "id" | "position">) => {
    const sectionIds = mapToSections(sectionXConfigs(), sectionYConfigs(), args.position);
    updateTaskPosition({
      board: board(),
      position: args.position,
      sectionX: sectionIds.sectionX?.id ?? null,
      sectionY: sectionIds.sectionY?.id ?? null,
      taskId: args.id,
    });
  };

  return {
    board,
    deleteEdge,
    deleteSection,
    deleteTask,
    insertEdgeToPoint,
    insertEdgeToTask,
    insertSection,
    insertTask,
    sectionXConfigs,
    sectionYConfigs,
    store,
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

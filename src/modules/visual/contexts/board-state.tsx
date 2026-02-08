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
import { BoardSchema, type BoardInstance } from "~/integrations/jazz/schema";
import {
  deleteEdgeInstance,
  insertEdgeFromPoint,
  insertEdgeToSecondTask,
  updateEdge,
} from "../utils/edge-actions";
import {
  deleteHorizontalSectionAndShift,
  deleteVerticalSectionAndShift,
  insertHorizonalSectionAndShift,
  insertVerticalSectionAndShift,
  updateHorizontalSectionData,
  updateHorizontalSectionSize,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import { getSectionConfig, mapToSections } from "../utils/section-configs";
import {
  deleteTaskWithDependencies,
  insertTaskInstance,
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
    input: Pick<
      TaskModel,
      "description" | "estimate" | "link" | "title" | "positionX" | "positionY"
    >,
  ) => {
    const position = { x: input.positionX, y: input.positionY };
    const sections = mapToSections(sectionXConfigs(), sectionYConfigs(), position);
    insertTaskInstance({
      board: board(),
      description: input.description,
      estimate: input.estimate,
      link: input.link,
      positionX: input.positionX,
      positionY: input.positionY,
      sectionX: sections.sectionX?.id ?? null,
      sectionY: sections.sectionY?.id ?? null,
      title: input.title,
    });
  };

  const insertHorizontalSection = (args: Pick<SectionModel, "name"> & { index: number }) => {
    insertHorizonalSectionAndShift({
      board: board(),
      index: args.index,
      name: args.name,
      sectionConfigs: sectionXConfigs(),
    });
  };

  const insertVerticalSection = (args: Pick<SectionModel, "name"> & { index: number }) => {
    insertVerticalSectionAndShift({
      board: board(),
      index: args.index,
      name: args.name,
      sectionConfigs: sectionYConfigs(),
    });
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

  const deleteHorizontalSection = (args: { endPosition: number; shift: number; id: string }) => {
    deleteHorizontalSectionAndShift({
      board: board(),
      endPosition: args.endPosition,
      sectionId: args.id,
      shift: args.shift,
    });
  };

  const deleteVerticalSection = (args: { endPosition: number; shift: number; id: string }) => {
    deleteVerticalSectionAndShift({
      board: board(),
      endPosition: args.endPosition,
      sectionId: args.id,
      shift: args.shift,
    });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskWithDependencies({
      board: board(),
      taskId,
    });
  };

  const deleteEdge = (edgeId: string) => {
    deleteEdgeInstance({
      board: board(),
      edgeId,
    });
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
    updateEdge({
      board: board(),
      breakX: edge.breakX,
      edgeId: edge.id,
    });
  };

  const updateHorizontalSectionName = (args: Pick<SectionModel, "id" | "name">) => {
    updateHorizontalSectionData({
      board: board(),
      id: args.id,
      name: args.name,
    });
  };

  const updateVerticalSectionName = (args: Pick<SectionModel, "id" | "name">) => {
    updateHorizontalSectionData({
      board: board(),
      id: args.id,
      name: args.name,
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

  const updateTask = (args: Pick<TaskModel, "id" | "positionX" | "positionY">) => {
    const position = { x: args.positionX, y: args.positionY };
    const sectionIds = mapToSections(sectionXConfigs(), sectionYConfigs(), position);
    updateTaskPosition({
      board: board(),
      position,
      sectionX: sectionIds.sectionX?.id ?? null,
      sectionY: sectionIds.sectionY?.id ?? null,
      taskId: args.id,
    });
  };

  return {
    board,
    deleteEdge,
    deleteHorizontalSection,
    deleteTask,
    deleteVerticalSection,
    insertEdgeToPoint,
    insertEdgeToTask,
    insertHorizontalSection,
    insertTask,
    insertVerticalSection,
    sectionXConfigs,
    sectionYConfigs,
    store,
    updateEdgePosition,
    updateHorizontalSectionName,
    updateHorizontalSectionPosition,
    updateTask,
    updateTaskModel,
    updateVerticalSectionName,
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

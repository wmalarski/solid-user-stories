import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  createContext,
  createMemo,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { useTanstackDbContext } from "~/integrations/tanstack-db/provider";
import type {
  BoardModel,
  EdgeModel,
  SectionModel,
  TaskModel,
} from "~/integrations/tanstack-db/schema";
import { insertEdgeFromPoint, insertEdgeToSecondTask } from "../utils/edge-actions";
import {
  deleteSectionAndShift,
  insertSectionAndShift,
  updateHorizontalSectionSize,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import { getSectionConfigs } from "../utils/section-configs";
import { deleteTaskWithDependencies } from "../utils/task-actions";

const createBoardStateContext = (board: Accessor<BoardModel>) => {
  const { taskCollection, edgeCollection, sectionCollection, boardsCollection } =
    useTanstackDbContext();

  const tasks = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.boardId, board().id)),
  );

  const edges = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.boardId, board().id))
      .innerJoin({ source: taskCollection }, ({ edge, source }) => eq(edge.source, source.id))
      .innerJoin({ target: taskCollection }, ({ edge, target }) => eq(edge.target, target.id)),
  );

  const sections = useLiveQuery((q) =>
    q.from({ section: sectionCollection }).where(({ section }) => eq(section.boardId, board().id)),
  );

  const sectionConfigs = createMemo(() => getSectionConfigs(sections(), board()));

  const updateTaskPosition = (
    task: Pick<TaskModel, "id" | "positionX" | "positionY" | "sectionX" | "sectionY">,
  ) => {
    taskCollection.update(task.id, (draft) => {
      draft.positionX = task.positionX;
      draft.positionY = task.positionY;
      draft.sectionX = task.sectionX;
      draft.sectionY = task.sectionY;
    });
  };

  const insertTask = (task: TaskModel) => {
    taskCollection.insert(task);
  };

  const updateTaskData = (
    task: Pick<TaskModel, "id" | "description" | "estimate" | "link" | "title">,
  ) => {
    taskCollection.update(task.id, (draft) => {
      draft.description = task.description;
      draft.estimate = task.estimate;
      draft.link = task.link;
      draft.title = task.title;
    });
  };

  const updateEdge = (edge: Pick<EdgeModel, "id" | "breakX">) => {
    edgeCollection.update(edge.id, (draft) => {
      draft.breakX = edge.breakX;
    });
  };

  const insertSection = (
    args: Pick<SectionModel, "name" | "orientation"> & {
      index: number;
    },
  ) => {
    insertSectionAndShift({
      boardId: board().id,
      boardsCollection,
      edgeCollection,
      edges: edges(),
      sectionCollection,
      sectionConfigs: sectionConfigs(),
      taskCollection,
      tasks: tasks(),
      ...args,
    });
  };

  const updateSectionData = (section: Pick<SectionModel, "id" | "name">) => {
    sectionCollection.update(section.id, (draft) => {
      draft.name = section.name;
    });
  };

  const updateHorizontalSectionPosition = (args: {
    position: number;
    draggedTasks: Map<string, number>;
    sectionId: string;
    startPosition: number;
    sectionStart: number;
  }) => {
    updateHorizontalSectionSize({
      sectionCollection,
      taskCollection,
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
    updateVerticalSectionSize({
      edgeCollection,
      sectionCollection,
      taskCollection,
      ...args,
    });
  };

  const deleteSection = (
    args: Pick<SectionModel, "id" | "orientation"> & {
      endPosition: number;
      shift: number;
    },
  ) => {
    deleteSectionAndShift({
      boardId: board().id,
      boardsCollection,
      edgeCollection,
      edges: edges(),
      sectionCollection,
      sectionId: args.id,
      taskCollection,
      tasks: tasks(),
      ...args,
    });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskWithDependencies({
      edgeCollection,
      edges: edges(),
      taskCollection,
      taskId,
    });
  };

  const deleteEdge = (edgeId: string) => {
    edgeCollection.delete(edgeId);
  };

  const insertEdgeToPoint = (args: { isSource: boolean; taskId: string; x: number; y: number }) => {
    return insertEdgeFromPoint({
      boardId: board().id,
      edgeCollection,
      edges: edges(),
      tasks: tasks(),
      ...args,
    });
  };

  const insertEdgeToTask = (args: { isSource: boolean; taskId: string; secondTaskId: string }) => {
    return insertEdgeToSecondTask({
      boardId: board().id,
      edgeCollection,
      tasks: tasks(),
      ...args,
    });
  };

  return {
    board,
    deleteEdge,
    deleteSection,
    deleteTask,
    edges,
    insertEdgeToPoint,
    insertEdgeToTask,
    insertSection,
    insertTask,
    sectionConfigs,
    sections,
    tasks,
    updateEdge,
    updateHorizontalSectionPosition,
    updateSectionData,
    updateTaskData,
    updateTaskPosition,
    updateVerticalSectionPosition,
  };
};

const BoardStateContext = createContext<ReturnType<typeof createBoardStateContext> | null>(null);

type EdgeEntries = ReturnType<ReturnType<typeof createBoardStateContext>["edges"]>;
export type EdgeEntry = EdgeEntries[0];

export const useBoardStateContext = () => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error("BoardStateContext is not defined");
  }
  return context;
};

export const useBoardId = () => {
  const context = useBoardStateContext();
  return createMemo(() => context.board().id);
};

type BoardStateProviderProps = ParentProps<{
  board: BoardModel;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};

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
  type TaskInput,
} from "~/integrations/jazz/schema";
import { useTanstackDbContext } from "~/integrations/tanstack-db/provider";
import type { SectionModel } from "~/integrations/tanstack-db/schema";
import { insertEdgeFromPoint, insertEdgeToSecondTask } from "../utils/edge-actions";
import {
  deleteSectionAndShift,
  insertSectionAndShift,
  updateHorizontalSectionSize,
  updateVerticalSectionSize,
} from "../utils/section-actions";
import { getSectionConfigs } from "../utils/section-configs";
import { deleteTaskWithDependencies } from "../utils/task-actions";

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
  const tasks = createJazzResource(() => ({
    id: board().tasks.$jazz.id,
    options: { resolve: false },
    schema: TaskListSchema,
  }));

  const edges = createJazzResource(() => ({
    id: board().edges.$jazz.id,
    options: { resolve: false },
    schema: EdgesListSchema,
  }));

  const sections = createJazzResource(() => ({
    id: board().sections.$jazz.id,
    options: { resolve: false },
    schema: SectionListSchema,
  }));

  const { taskCollection, edgeCollection, sectionCollection, boardsCollection } =
    useTanstackDbContext();

  const sectionConfigs = createMemo(() =>
    getSectionConfigs(
      board(),
      sections()?.map((section) => section),
    ),
  );

  const insertTask = (task: TaskInput) => {
    tasks()?.$jazz.push(task);
  };

  const insertSection = (
    args: Pick<SectionModel, "name" | "orientation"> & {
      index: number;
    },
  ) => {
    insertSectionAndShift({
      edgeCollection,
      edges: edges(),
      sectionConfigs: sectionConfigs(),
      taskCollection,
      tasks: tasks(),
      ...args,
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
      sectionId: args.id,
      sections: sections(),
      taskCollection,
      tasks: tasks(),
      ...args,
    });
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
    return insertEdgeFromPoint({
      edges: edges(),
      tasks: tasks(),
      ...args,
    });
  };

  const insertEdgeToTask = (args: { isSource: boolean; taskId: string; secondTaskId: string }) => {
    return insertEdgeToSecondTask({
      edges: edges(),
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
    updateHorizontalSectionPosition,
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

type BoardStateProviderProps = ParentProps<{
  board: BoardInstance;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};

import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import type {
  BoardsCollection,
  EdgeCollection,
  SectionCollection,
  TaskCollection,
} from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import { useTanstackDbContext } from "~/integrations/tanstack-db/provider";
import type {
  BoardModel,
  EdgeModel,
  SectionModel,
  TaskModel,
} from "~/integrations/tanstack-db/schema";
import {
  SECTION_X_OFFSET,
  SECTION_Y_OFFSET,
  TASK_RECT_HEIGHT,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import type { SectionConfigs } from "./section-configs";

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
      sectionConfigsValue: SectionConfigs;
    },
  ) => {
    insertSectionAndShift({
      boardId: board().id,
      boardsCollection,
      edgeCollection,
      edges: edges(),
      sectionCollection,
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
    sections,
    tasks,
    updateEdge,
    updateSectionData,
    updateTaskData,
    updateTaskPosition,
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

const getEdgesByTask = (edges: EdgeEntries, taskId: string) => {
  return edges
    .map((entry) => entry.edge)
    .filter((edge) => edge.source === taskId || edge.target === taskId);
};

type DeleteTaskWithDependenciesArgs = {
  taskId: string;
  edges: EdgeEntries;
  taskCollection: TaskCollection;
  edgeCollection: EdgeCollection;
};

const deleteTaskWithDependencies = ({
  edges,
  taskId,
  taskCollection,
  edgeCollection,
}: DeleteTaskWithDependenciesArgs) => {
  const taskEdges = getEdgesByTask(edges, taskId);
  if (edges.length > 0) {
    edgeCollection.delete(taskEdges.map((edge) => edge.id));
  }
  taskCollection.delete(taskId);
};

type GetDragStartTaskStateArgs = {
  position: number;
  tasks: TaskModel[];
  offset: number;
  attribute: "positionY" | "positionX";
};

export const getDragStartTaskState = ({
  position,
  tasks,
  offset,
  attribute,
}: GetDragStartTaskStateArgs) => {
  let maxNotDraggedPosition = 0;
  const draggedTasks = new Map<string, number>();

  for (const entry of tasks) {
    const entryPosition = entry[attribute];
    if (entryPosition > position + offset) {
      draggedTasks.set(entry.id, entryPosition);
    } else {
      const shiftedPosition = entryPosition - offset + 10;
      maxNotDraggedPosition = Math.max(maxNotDraggedPosition, shiftedPosition);
    }
  }

  return { draggedTasks, maxNotDraggedPosition };
};

type GetDragStartEdgeStateArgs = {
  position: number;
  edges: EdgeEntry[];
  offset: number;
};

export const getDragStartEdgeState = ({ position, edges, offset }: GetDragStartEdgeStateArgs) => {
  const draggedEdges = new Map<string, number>();

  for (const entry of edges) {
    const entryPosition = entry.edge.breakX;
    if (entryPosition > position + offset) {
      draggedEdges.set(entry.edge.id, entryPosition);
    }
  }

  return { draggedEdges };
};

type UpdateTaskPositionsArgs = {
  update: Map<string, number>;
  shift: number;
  attribute: "positionY" | "positionX";
  taskCollection: TaskCollection;
};

export const updateTaskPositions = ({
  update,
  shift,
  attribute,
  taskCollection,
}: UpdateTaskPositionsArgs) => {
  if (update.size > 0) {
    taskCollection.update([...update.keys()], (drafts) => {
      for (const draft of drafts) {
        const position = update.get(draft.id) ?? draft[attribute];
        draft[attribute] = position + shift;
      }
    });
  }
};

type UpdateEdgePositionsArgs = {
  update: Map<string, number>;
  shift: number;
  edgeCollection: EdgeCollection;
};

export const updateEdgePositions = ({ edgeCollection, update, shift }: UpdateEdgePositionsArgs) => {
  if (update.size > 0) {
    edgeCollection.update([...update.keys()], (drafts) => {
      for (const draft of drafts) {
        const position = update.get(draft.id) ?? draft.breakX;
        draft.breakX = position + shift;
      }
    });
  }
};

type ShiftSectionArgs = {
  index: number;
  sectionId: string;
  boardId: string;
  sectionConfigsValue: SectionConfigs;
  attribute: "x" | "y";
  boardsCollection: BoardsCollection;
};

const shiftSections = ({
  attribute,
  index,
  boardId,
  sectionId,
  boardsCollection,
  sectionConfigsValue,
}: ShiftSectionArgs) => {
  const sectionIds = sectionConfigsValue[attribute].map((config) => config.section.id);
  sectionIds.splice(index + 1, 0, sectionId);
  const key = attribute === "x" ? "sectionXOrder" : "sectionYOrder";
  boardsCollection.update(boardId, (draft) => {
    draft[key] = sectionIds;
  });
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  tasks: TaskModel[];
  attribute: "positionY" | "positionX";
  taskCollection: TaskCollection;
};

const shiftTasks = ({ shift, tasks, position, attribute, taskCollection }: ShiftTasksArgs) => {
  const tasksToMove = tasks.filter((entry) => entry[attribute] > position).map((entry) => entry.id);

  if (tasksToMove.length > 0) {
    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft[attribute] += shift;
      }
    });
  }
};

type ShiftEdgesArgs = {
  shift: number;
  position: number;
  edges: EdgeEntry[];
  edgeCollection: EdgeCollection;
};

const shiftEdges = ({ shift, edges, position, edgeCollection }: ShiftEdgesArgs) => {
  const egesToMove = edges
    .filter((entry) => entry.edge.breakX > position)
    .map((entry) => entry.edge.id);

  if (egesToMove.length > 0) {
    edgeCollection.update(egesToMove, (drafts) => {
      for (const draft of drafts) {
        draft.breakX += shift;
      }
    });
  }
};

const numberSortAscending = (left: number, right: number) => left - right;

type GetBoardBoxArgs = {
  tasks: TaskModel[];
  edges: EdgeEntry[];
  sections: SectionConfigs;
};

export const getBoardBox = ({ tasks, edges, sections }: GetBoardBoxArgs) => {
  const xValues = [
    ...tasks.flatMap((task) => [
      task.positionX + SECTION_X_OFFSET,
      task.positionX + TASK_RECT_HEIGHT + SECTION_X_OFFSET,
    ]),
    ...edges.map((entry) => entry.edge.breakX + SECTION_X_OFFSET),
    ...sections.x.flatMap((section) => [section.start, section.end]),
  ];

  const yValues = [
    ...tasks.flatMap((task) => [
      task.positionY + SECTION_Y_OFFSET,
      task.positionY + SECTION_Y_OFFSET + TASK_RECT_WIDTH,
    ]),
    ...sections.y.flatMap((section) => [section.start, section.end]),
  ];

  xValues.sort(numberSortAscending);
  yValues.sort(numberSortAscending);

  const maxX = xValues.at(-1) ?? 0;
  const maxY = yValues.at(-1) ?? 0;
  const minX = xValues.at(0) ?? 0;
  const minY = yValues.at(0) ?? 0;

  return {
    height: maxY - minY,
    shiftX: -minX,
    shiftY: -minY,
    width: maxX - minX,
  };
};

type InsertSectionAndShiftArgs = {
  sectionCollection: SectionCollection;
  edgeCollection: EdgeCollection;
  taskCollection: TaskCollection;
  boardsCollection: BoardsCollection;
  boardId: string;
  name: string;
  orientation: SectionModel["orientation"];
  index: number;
  tasks: TaskModel[];
  edges: EdgeEntry[];
  sectionConfigsValue: SectionConfigs;
};

const insertSectionAndShift = ({
  sectionCollection,
  edgeCollection,
  taskCollection,
  boardsCollection,
  boardId,
  name,
  orientation,
  index,
  tasks,
  edges,
  sectionConfigsValue,
}: InsertSectionAndShiftArgs) => {
  const shift = 500;
  const sectionId = createId();
  sectionCollection.insert({ boardId, id: sectionId, name, orientation, size: shift });

  if (orientation === "horizontal") {
    const position = sectionConfigsValue.x[index].end;
    shiftTasks({ attribute: "positionX", position, shift, taskCollection, tasks });
    shiftEdges({ edgeCollection, edges, position, shift });
    shiftSections({
      attribute: "x",
      boardId,
      boardsCollection,
      index,
      sectionConfigsValue,
      sectionId,
    });
  } else {
    const position = sectionConfigsValue.y[index].end;
    shiftTasks({ attribute: "positionY", position, shift, taskCollection, tasks });
    shiftSections({
      attribute: "y",
      boardId,
      boardsCollection,
      index,
      sectionConfigsValue,
      sectionId,
    });
  }
};

type DeleteSectionAndShiftArgs = {
  sectionCollection: SectionCollection;
  edgeCollection: EdgeCollection;
  taskCollection: TaskCollection;
  boardsCollection: BoardsCollection;
  boardId: string;
  sectionId: string;
  orientation: SectionModel["orientation"];
  endPosition: number;
  shift: number;
  tasks: TaskModel[];
  edges: EdgeEntry[];
};

const deleteSectionAndShift = ({
  boardsCollection,
  edgeCollection,
  sectionCollection,
  taskCollection,
  boardId,
  sectionId,
  orientation,
  endPosition,
  shift,
  edges,
  tasks,
}: DeleteSectionAndShiftArgs) => {
  boardsCollection.update(boardId, (draft) => {
    draft.sectionXOrder = draft.sectionXOrder.filter((id) => id !== sectionId);
    draft.sectionYOrder = draft.sectionYOrder.filter((id) => id !== sectionId);
  });

  if (orientation === "horizontal") {
    shiftTasks({ attribute: "positionX", position: endPosition, shift, taskCollection, tasks });
    shiftEdges({ edgeCollection, edges, position: endPosition, shift });
  } else {
    shiftTasks({ attribute: "positionY", position: endPosition, shift, taskCollection, tasks });
  }

  sectionCollection.delete(sectionId);
};

type InsertEdgeFromPointArgs = {
  edgeCollection: EdgeCollection;
  tasks: TaskModel[];
  edges: EdgeEntry[];
  x: number;
  y: number;
  boardId: string;
  taskId: string;
  isSource: boolean;
};

const insertEdgeFromPoint = ({
  edgeCollection,
  edges,
  tasks,
  x,
  y,
  boardId,
  taskId,
  isSource,
}: InsertEdgeFromPointArgs) => {
  const currentTask = tasks.find((task) => task.id === taskId);

  const task = tasks.find(
    (task) =>
      task.positionX < x &&
      x < task.positionX + TASK_RECT_WIDTH &&
      task.positionY < y &&
      y < task.positionY + TASK_RECT_HEIGHT,
  );

  if (!task || !currentTask || task.id === taskId) {
    return;
  }

  const source = isSource ? taskId : task.id;
  const target = isSource ? task.id : taskId;

  const hasTheSameConnection = edges.some(
    (entry) =>
      (entry.edge.source === source && entry.edge.target === target) ||
      (entry.edge.source === target && entry.edge.target === source),
  );

  if (hasTheSameConnection) {
    return;
  }

  const breakX = (currentTask.positionX + task.positionX + TASK_RECT_WIDTH) / 2;

  const edgeId = createId();

  edgeCollection.insert({ boardId, breakX, id: edgeId, source, target });

  return edgeId;
};

type InsertEdgeToTaskArgs = {
  edgeCollection: EdgeCollection;
  tasks: TaskModel[];
  boardId: string;
  taskId: string;
  secondTaskId: string;
  isSource: boolean;
};

const insertEdgeToSecondTask = ({
  edgeCollection,
  tasks,
  boardId,
  taskId,
  isSource,
  secondTaskId,
}: InsertEdgeToTaskArgs) => {
  const currentTask = tasks.find((task) => task.id === taskId);
  const secondTask = tasks.find((task) => task.id === secondTaskId);

  if (!secondTask || !currentTask) {
    return;
  }

  const breakX = (currentTask.positionX + secondTask.positionX + TASK_RECT_WIDTH) / 2;

  const edgeId = createId();

  edgeCollection.insert({
    boardId,
    breakX,
    id: edgeId,
    source: isSource ? taskId : secondTaskId,
    target: isSource ? secondTaskId : taskId,
  });

  return edgeId;
};

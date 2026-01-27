import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import {
  boardsCollection,
  edgeCollection,
  sectionCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import type { BoardModel, TaskModel } from "~/integrations/tanstack-db/schema";
import {
  SECTION_X_OFFSET,
  SECTION_Y_OFFSET,
  TASK_RECT_HEIGHT,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import type { SectionConfigs } from "./section-configs";

const createBoardStateContext = (board: Accessor<BoardModel>) => {
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

  return { board, edges, sections, tasks };
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

export const deleteTaskWithDependencies = (taskId: string, edges: EdgeEntries) => {
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
};

export const updateTaskPositions = ({ update, shift, attribute }: UpdateTaskPositionsArgs) => {
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
};

export const updateEdgePositions = ({ update, shift }: UpdateEdgePositionsArgs) => {
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
};

export const shiftSections = ({
  attribute,
  index,
  boardId,
  sectionId,
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
};

export const shiftTasks = ({ shift, tasks, position, attribute }: ShiftTasksArgs) => {
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
};

export const shiftEdges = ({ shift, edges, position }: ShiftEdgesArgs) => {
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

  const maxX = xValues.at(-1) || 0;
  const maxY = yValues.at(-1) || 0;
  const minX = xValues.at(0) || 0;
  const minY = yValues.at(0) || 0;

  return {
    height: maxY - minY,
    shiftX: -minX,
    shiftY: -minY,
    width: maxX - minX,
  };
};

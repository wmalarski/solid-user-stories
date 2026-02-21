import { getLoadedOrUndefined } from "jazz-tools";
import { EdgeSchema } from "~/integrations/jazz/schema";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "../utils/constants";
import type { BoardStateContextValue } from "./board-state";
import { findEdge, findTask, getTaskMap } from "./instance-maps";

export type InsertEdgeInstanceToPointArgs = {
  boardState: BoardStateContextValue;
  x: number;
  y: number;
  taskId: string;
  isSource: boolean;
};

export const insertEdgeInstanceToPoint = ({
  boardState,
  x,
  y,
  taskId,
  isSource,
}: InsertEdgeInstanceToPointArgs) => {
  const board = boardState.board();
  const edges = getLoadedOrUndefined(board.edges);

  if (!edges) {
    return null;
  }

  const loadedEdges = edges.flatMap((edge) => (edge.$isLoaded ? [edge] : []));

  const taskMap = getTaskMap(board);
  const currentTask = taskMap.get(taskId);

  const found = taskMap
    .entries()
    .find(
      ([_taskId, task]) =>
        task.positionX < x &&
        x < task.positionX + TASK_RECT_WIDTH &&
        task.positionY < y &&
        y < task.positionY + TASK_RECT_HEIGHT,
    );

  if (!found || !currentTask) {
    return null;
  }

  const [cursorTaskId, cursorTask] = found;

  if (cursorTaskId === taskId) {
    return null;
  }

  const source = isSource ? taskId : cursorTaskId;
  const target = isSource ? cursorTaskId : taskId;

  const hasTheSameConnection = loadedEdges.some(
    (entry) =>
      (entry.source === source && entry.target === target) ||
      (entry.source === target && entry.target === source),
  );

  if (hasTheSameConnection) {
    return null;
  }

  const breakX = (currentTask.positionX + cursorTask.positionX + TASK_RECT_WIDTH) / 2;

  const edge = EdgeSchema.create({ breakX, source, target }, { owner: board.$jazz.owner });
  edges.$jazz.push(edge);

  return edge.$jazz.id;
};

export type InsertEdgeInstanceToTaskArgs = {
  boardState: BoardStateContextValue;
  taskId: string;
  secondTaskId: string;
  isSource: boolean;
};

export const insertEdgeInstanceToSecondTask = ({
  boardState,
  taskId,
  isSource,
  secondTaskId,
}: InsertEdgeInstanceToTaskArgs) => {
  const board = boardState.board();
  const currentTask = findTask(board, taskId);
  const secondTask = findTask(board, secondTaskId);

  const edges = getLoadedOrUndefined(board.edges);

  if (!secondTask || !currentTask || !edges) {
    return null;
  }

  const breakX = (currentTask.positionX + secondTask.positionX + TASK_RECT_WIDTH) / 2;

  const edge = EdgeSchema.create(
    {
      breakX,
      source: isSource ? taskId : secondTaskId,
      target: isSource ? secondTaskId : taskId,
    },
    { owner: board.$jazz.owner },
  );
  edges.$jazz.push(edge);

  return edge.$jazz.id;
};

export type UpdateEdgeInstanceArgs = {
  boardState: BoardStateContextValue;
  edgeId: string;
  breakX: number;
};

export const updateEdgeInstance = ({ boardState, breakX, edgeId }: UpdateEdgeInstanceArgs) => {
  const board = boardState.board();
  const instance = findEdge(board, edgeId);
  instance?.$jazz.set("breakX", breakX);
};

export type DeleteEdgeInstanceArgs = {
  boardState: BoardStateContextValue;
  edgeId: string;
};

export const deleteEdgeInstance = ({ boardState, edgeId }: DeleteEdgeInstanceArgs) => {
  const board = boardState.board();
  getLoadedOrUndefined(board.edges)?.$jazz.remove((edge) => edge.$jazz.id === edgeId);
};

import { getLoadedOrUndefined } from "jazz-tools";
import type { BoardInstance, EdgeInstance, TaskInstance } from "~/integrations/jazz/schema";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";

type InsertEdgeFromPointArgs = {
  board: BoardInstance;
  x: number;
  y: number;
  taskId: string;
  isSource: boolean;
  taskPositions: Map<string, TaskInstance>;
};

export const insertEdgeFromPoint = ({
  board,
  x,
  y,
  taskId,
  isSource,
  taskPositions,
}: InsertEdgeFromPointArgs) => {
  const edges = getLoadedOrUndefined(board.edges);

  if (!edges) {
    return;
  }

  const loadedEdges = edges?.flatMap((edge) => (edge.$isLoaded ? [edge] : [])) ?? [];

  const currentTask = taskPositions.get(taskId);

  const found = taskPositions
    .entries()
    .find(
      ([_taskId, task]) =>
        task.positionX < x &&
        x < task.positionX + TASK_RECT_WIDTH &&
        task.positionY < y &&
        y < task.positionY + TASK_RECT_HEIGHT,
    );

  if (!found || !currentTask) {
    return;
  }

  const [cursorTaskId, cursorTask] = found;

  if (cursorTaskId === taskId) {
    return;
  }

  const source = isSource ? taskId : cursorTaskId;
  const target = isSource ? cursorTaskId : taskId;

  const hasTheSameConnection = loadedEdges.some(
    (entry) =>
      (entry.source === source && entry.target === target) ||
      (entry.source === target && entry.target === source),
  );

  if (hasTheSameConnection) {
    return;
  }

  const breakX = (currentTask.positionX + cursorTask.positionX + TASK_RECT_WIDTH) / 2;

  const size = edges.$jazz.push({ breakX, source, target });
  return edges[size - 1].$jazz.id;
};

type InsertEdgeToTaskArgs = {
  board: BoardInstance;
  taskId: string;
  secondTaskId: string;
  isSource: boolean;
  taskPositions: Map<string, TaskInstance>;
};

export const insertEdgeToSecondTask = ({
  board,
  taskId,
  isSource,
  secondTaskId,
  taskPositions,
}: InsertEdgeToTaskArgs) => {
  const currentTask = taskPositions.get(taskId);
  const secondTask = taskPositions.get(secondTaskId);

  const edges = getLoadedOrUndefined(board.edges);

  if (!secondTask || !currentTask || !edges) {
    return;
  }

  const breakX = (currentTask.positionX + secondTask.positionX + TASK_RECT_WIDTH) / 2;

  const size = edges.$jazz.push({
    breakX,
    source: isSource ? taskId : secondTaskId,
    target: isSource ? secondTaskId : taskId,
  });

  return edges[size - 1].$jazz.id;
};

export const updateEdge = (instance: EdgeInstance, edge: Pick<EdgeInstance, "breakX">) => {
  instance.$jazz.set("breakX", edge.breakX);
};

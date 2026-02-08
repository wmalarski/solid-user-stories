import type {
  EdgeBreakInstance,
  EdgeListInstance,
  TaskListInstance,
  TaskPositionInstance,
} from "~/integrations/jazz/schema";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";

type InsertEdgeFromPointArgs = {
  edges: EdgeListInstance;
  x: number;
  y: number;
  taskId: string;
  isSource: boolean;
  taskPositions: Map<string, TaskPositionInstance>;
};

export const insertEdgeFromPoint = ({
  edges,
  x,
  y,
  taskId,
  isSource,
  taskPositions,
}: InsertEdgeFromPointArgs) => {
  const loadedEdges = edges?.flatMap((edge) => (edge.$isLoaded ? [edge] : [])) ?? [];

  const currentTask = taskPositions.get(taskId);

  const found = taskPositions
    .entries()
    .find(
      ([_taskId, task]) =>
        task.x < x && x < task.x + TASK_RECT_WIDTH && task.y < y && y < task.y + TASK_RECT_HEIGHT,
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

  const breakX = (currentTask.x + cursorTask.x + TASK_RECT_WIDTH) / 2;

  const size = edges.$jazz.push({ breakX: { value: breakX }, source, target });
  return edges[size - 1].$jazz.id;
};

type InsertEdgeToTaskArgs = {
  taskId: string;
  secondTaskId: string;
  isSource: boolean;
  tasks: TaskListInstance;
  edges: EdgeListInstance;
  taskPositions: Map<string, TaskPositionInstance>;
};

export const insertEdgeToSecondTask = ({
  taskId,
  isSource,
  secondTaskId,
  edges,
  taskPositions,
}: InsertEdgeToTaskArgs) => {
  const currentTask = taskPositions.get(taskId);
  const secondTask = taskPositions.get(secondTaskId);

  if (!secondTask || !currentTask) {
    return;
  }

  const breakX = (currentTask.x + secondTask.x + TASK_RECT_WIDTH) / 2;

  const size = edges.$jazz.push({
    breakX: { value: breakX },
    source: isSource ? taskId : secondTaskId,
    target: isSource ? secondTaskId : taskId,
  });

  return edges[size - 1].$jazz.id;
};

export const updateEdge = (instance: EdgeBreakInstance, edge: Pick<EdgeBreakInstance, "value">) => {
  instance.$jazz.set("value", edge.value);
};

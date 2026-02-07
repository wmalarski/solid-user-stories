import type {
  EdgeInput,
  EdgeInstance,
  EdgeListInstance,
  TaskListInstance,
} from "~/integrations/jazz/schema";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";

type InsertEdgeFromPointArgs = {
  tasks?: TaskListInstance;
  edges?: EdgeListInstance;
  x: number;
  y: number;
  taskId: string;
  isSource: boolean;
};

export const insertEdgeFromPoint = ({
  edges,
  tasks,
  x,
  y,
  taskId,
  isSource,
}: InsertEdgeFromPointArgs) => {
  const loadedTasks = tasks?.flatMap((task) => (task.$isLoaded ? [task] : [])) ?? [];
  const loadedEdges = edges?.flatMap((edge) => (edge.$isLoaded ? [edge] : [])) ?? [];

  const currentTask = loadedTasks.find((task) => task.$jazz.id === taskId);

  const task = loadedTasks.find(
    (task) =>
      task.positionX < x &&
      x < task.positionX + TASK_RECT_WIDTH &&
      task.positionY < y &&
      y < task.positionY + TASK_RECT_HEIGHT,
  );

  if (!task || !currentTask || task.$jazz.id === taskId) {
    return;
  }

  const source = isSource ? taskId : task.$jazz.id;
  const target = isSource ? task.$jazz.id : taskId;

  const hasTheSameConnection = loadedEdges.some(
    (entry) =>
      (entry.source === source && entry.target === target) ||
      (entry.source === target && entry.target === source),
  );

  if (hasTheSameConnection) {
    return;
  }

  const breakX = (currentTask.positionX + task.positionX + TASK_RECT_WIDTH) / 2;

  const index = edges?.$jazz.push({ breakX, source, target }) ?? 0;

  return edges?.at(index - 1)?.$jazz.id;
};

type InsertEdgeToTaskArgs = {
  taskId: string;
  secondTaskId: string;
  isSource: boolean;
  tasks?: TaskListInstance;
  edges?: EdgeListInstance;
};

export const insertEdgeToSecondTask = ({
  taskId,
  isSource,
  secondTaskId,
  edges,
  tasks,
}: InsertEdgeToTaskArgs) => {
  const loadedTasks = tasks?.flatMap((task) => (task.$isLoaded ? [task] : [])) ?? [];

  const currentTask = loadedTasks.find((task) => task.$jazz.id === taskId);
  const secondTask = loadedTasks.find((task) => task.$jazz.id === secondTaskId);

  if (!secondTask || !currentTask) {
    return;
  }

  const breakX = (currentTask.positionX + secondTask.positionX + TASK_RECT_WIDTH) / 2;

  const index =
    edges?.$jazz.push({
      breakX,
      source: isSource ? taskId : secondTaskId,
      target: isSource ? secondTaskId : taskId,
    }) ?? 0;

  return edges?.at(index - 1)?.$jazz.id;
};

export const updateEdge = (instance: EdgeInstance, edge: Pick<EdgeInput, "breakX">) => {
  instance.$jazz.set("breakX", edge.breakX);
};

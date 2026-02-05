import type { EdgeCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import type { EdgeEntry } from "../contexts/board-state";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";

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

export const insertEdgeFromPoint = ({
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

export const insertEdgeToSecondTask = ({
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

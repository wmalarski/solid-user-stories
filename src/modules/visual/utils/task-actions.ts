import { getLoadedOrUndefined } from "jazz-tools";
import type { BoardInstance, TaskInstance } from "~/integrations/jazz/schema";
import { getTaskMap } from "./instance-maps";

export type InsertTaskInstanceArgs = Pick<
  TaskInstance,
  | "description"
  | "estimate"
  | "link"
  | "title"
  | "positionX"
  | "positionY"
  | "sectionX"
  | "sectionY"
> & {
  board: BoardInstance;
};

export const insertTaskInstance = ({ board, ...args }: InsertTaskInstanceArgs) => {
  const tasksValue = getLoadedOrUndefined(board.tasks);
  if (!tasksValue) {
    return;
  }
  tasksValue.$jazz.push(args);
};

export type DeleteTaskInstanceArgs = {
  board: BoardInstance;
  taskId: string;
};

export const deleteTaskInstance = ({ board, taskId }: DeleteTaskInstanceArgs) => {
  getLoadedOrUndefined(board.edges)?.$jazz.remove((edge) =>
    edge.$isLoaded ? edge.target === taskId || edge.source === taskId : false,
  );
  getLoadedOrUndefined(board.tasks)?.$jazz.remove((task) => task.$jazz.id === taskId);
};

export type UpdateTaskInstancePositionArgs = Pick<
  TaskInstance,
  "sectionX" | "sectionY" | "positionX" | "positionY"
> & {
  board: BoardInstance;
  taskId: string;
};

export const updateTaskInstancePosition = ({
  board,
  positionX,
  positionY,
  taskId,
  sectionX,
  sectionY,
}: UpdateTaskInstancePositionArgs) => {
  const taskMap = getTaskMap(board);
  const instance = taskMap.get(taskId);

  if (!instance) {
    return;
  }

  instance.$jazz.set("positionX", positionX);
  instance.$jazz.set("positionY", positionY);
  instance.$jazz.set("sectionX", sectionX);
  instance.$jazz.set("sectionY", sectionY);
};

export type UpdateTaskInstanceDetailsArgs = Pick<
  TaskInstance,
  "description" | "estimate" | "link" | "title"
> & {
  board: BoardInstance;
  taskId: string;
};

export const updateTaskInstanceDetails = ({
  board,
  description,
  estimate,
  link,
  taskId,
  title,
}: UpdateTaskInstanceDetailsArgs) => {
  const taskMap = getTaskMap(board);
  const instance = taskMap.get(taskId);

  if (!instance) {
    return;
  }

  instance.$jazz.set("description", description);
  instance.$jazz.set("estimate", estimate);
  instance.$jazz.set("link", link);
  instance.$jazz.set("title", title);
};

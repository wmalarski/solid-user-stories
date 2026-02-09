import { getLoadedOrUndefined } from "jazz-tools";
import type { TaskInstance } from "~/integrations/jazz/schema";
import type { BoardStateContextValue } from "../contexts/board-state";
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
  boardState: BoardStateContextValue;
};

export const insertTaskInstance = ({ boardState, ...args }: InsertTaskInstanceArgs) => {
  const board = boardState.board();
  const tasksValue = getLoadedOrUndefined(board.tasks);
  if (!tasksValue) {
    return;
  }
  const size = tasksValue.$jazz.push(args);
  return tasksValue[size - 1].$jazz.id;
};

export type DeleteTaskInstanceArgs = {
  boardState: BoardStateContextValue;
  taskId: string;
};

export const deleteTaskInstance = ({ boardState, taskId }: DeleteTaskInstanceArgs) => {
  const board = boardState.board();
  getLoadedOrUndefined(board.edges)?.$jazz.remove((edge) =>
    edge.$isLoaded ? edge.target === taskId || edge.source === taskId : false,
  );
  getLoadedOrUndefined(board.tasks)?.$jazz.remove((task) => task.$jazz.id === taskId);
};

export type UpdateTaskInstancePositionArgs = Pick<
  TaskInstance,
  "sectionX" | "sectionY" | "positionX" | "positionY"
> & {
  boardState: BoardStateContextValue;
  taskId: string;
};

export const updateTaskInstancePosition = ({
  boardState,
  positionX,
  positionY,
  taskId,
  sectionX,
  sectionY,
}: UpdateTaskInstancePositionArgs) => {
  const board = boardState.board();
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
  boardState: BoardStateContextValue;
  taskId: string;
};

export const updateTaskInstanceDetails = ({
  boardState,
  description,
  estimate,
  link,
  taskId,
  title,
}: UpdateTaskInstanceDetailsArgs) => {
  const board = boardState.board();
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

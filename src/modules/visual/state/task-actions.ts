import { getLoadedOrUndefined } from "jazz-tools";
import { TaskSchema, type TaskInstanceInput } from "~/integrations/jazz/schema";
import type { BoardStateContextValue } from "./board-state";
import { findTask } from "./instance-maps";

export type InsertTaskInstanceArgs = TaskInstanceInput & {
  boardState: BoardStateContextValue;
};

export const insertTaskInstance = ({ boardState, ...args }: InsertTaskInstanceArgs) => {
  const board = boardState.board();
  const tasksValue = getLoadedOrUndefined(board.tasks);
  if (!tasksValue) {
    return;
  }
  const task = TaskSchema.create(args);
  tasksValue.$jazz.push(task);
  return task.$jazz.id;
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
  TaskInstanceInput,
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
  const instance = findTask(board, taskId);

  if (!instance) {
    return;
  }

  instance.$jazz.set("positionX", positionX);
  instance.$jazz.set("positionY", positionY);
  instance.$jazz.set("sectionX", sectionX);
  instance.$jazz.set("sectionY", sectionY);
};

export type UpdateTaskInstanceDetailsArgs = Pick<
  TaskInstanceInput,
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
  const instance = findTask(board, taskId);

  if (!instance) {
    return;
  }

  instance.$jazz.set("description", description);
  instance.$jazz.set("estimate", estimate);
  instance.$jazz.set("link", link);
  instance.$jazz.set("title", title);
};

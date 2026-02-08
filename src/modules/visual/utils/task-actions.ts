import { getLoadedOrUndefined } from "jazz-tools";
import type { BoardInstance, TaskInstance } from "~/integrations/jazz/schema";
import { getTaskMap } from "./instance-maps";
import type { Point2D } from "./types";

type DeleteTaskWithDependenciesArgs = {
  board: BoardInstance;
  taskId: string;
};

export const deleteTaskWithDependencies = ({ board, taskId }: DeleteTaskWithDependenciesArgs) => {
  getLoadedOrUndefined(board.edges)?.$jazz.remove((edge) =>
    edge.$isLoaded ? edge.target === taskId || edge.source === taskId : false,
  );
  getLoadedOrUndefined(board.tasks)?.$jazz.remove((task) => task.$jazz.id === taskId);
};

type UpdateTaskPositionArgs = Pick<TaskInstance, "sectionX" | "sectionY"> & {
  board: BoardInstance;
  taskId: string;
  position: Point2D;
};

export const updateTaskPosition = ({
  board,
  position,
  taskId,
  sectionX,
  sectionY,
}: UpdateTaskPositionArgs) => {
  const taskMap = getTaskMap(board);
  const instance = taskMap.get(taskId);

  if (!instance) {
    return;
  }

  instance.$jazz.set("positionX", position.x);
  instance.$jazz.set("positionY", position.y);
  instance.$jazz.set("sectionX", sectionX);
  instance.$jazz.set("sectionY", sectionY);
};

type UpdateTaskDataArgs = Pick<TaskInstance, "description" | "estimate" | "link" | "title"> & {
  board: BoardInstance;
  taskId: string;
};

export const updateTaskData = ({
  board,
  description,
  estimate,
  link,
  taskId,
  title,
}: UpdateTaskDataArgs) => {
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

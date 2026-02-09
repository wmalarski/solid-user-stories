import { getLoadedOrUndefined } from "jazz-tools";
import type { BoardInstance, EdgeInstance, TaskInstance } from "~/integrations/jazz/schema";

export const getTaskMap = (board: BoardInstance) => {
  const map = new Map<string, TaskInstance>();
  for (const task of getLoadedOrUndefined(board.tasks) ?? []) {
    const value = getLoadedOrUndefined(task);
    if (value) {
      map.set(value.$jazz.id, value);
    }
  }
  return map;
};

export const findTask = (board: BoardInstance, taskId: string) => {
  const found = getLoadedOrUndefined(board.tasks)?.find((task) => task.$jazz.id === taskId);
  return found && getLoadedOrUndefined(found);
};

export const getEdgeMap = (board: BoardInstance) => {
  const map = new Map<string, EdgeInstance>();
  for (const edge of getLoadedOrUndefined(board.edges) ?? []) {
    const value = getLoadedOrUndefined(edge);
    if (value) {
      map.set(value.$jazz.id, value);
    }
  }
  return map;
};

export const findEdge = (board: BoardInstance, edgeId: string) => {
  const found = getLoadedOrUndefined(board.edges)?.find((edge) => edge.$jazz.id === edgeId);
  return found && getLoadedOrUndefined(found);
};

export const findSectionX = (board: BoardInstance, sectionId: string) => {
  const sections = getLoadedOrUndefined(board.sectionX);
  const found = sections?.find((section) => section.$jazz.id === sectionId);
  return found && getLoadedOrUndefined(found);
};

export const findSectionY = (board: BoardInstance, sectionId: string) => {
  const sections = getLoadedOrUndefined(board.sectionY);
  const found = sections?.find((section) => section.$jazz.id === sectionId);
  return found && getLoadedOrUndefined(found);
};

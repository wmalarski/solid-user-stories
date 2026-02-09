import { getLoadedOrUndefined } from "jazz-tools";
import type {
  BoardInstance,
  EdgeInstance,
  SectionInstance,
  TaskInstance,
} from "~/integrations/jazz/schema";

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

export const getSectionXMap = (board: BoardInstance) => {
  const map = new Map<string, SectionInstance>();
  for (const section of getLoadedOrUndefined(board.sectionX) ?? []) {
    const value = getLoadedOrUndefined(section);
    if (value) {
      map.set(value.$jazz.id, value);
    }
  }
  return map;
};

export const getSectionYMap = (board: BoardInstance) => {
  const map = new Map<string, SectionInstance>();
  for (const section of getLoadedOrUndefined(board.sectionY) ?? []) {
    const value = getLoadedOrUndefined(section);
    if (value) {
      map.set(value.$jazz.id, value);
    }
  }
  return map;
};

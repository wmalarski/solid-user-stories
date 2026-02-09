import { getLoadedOrUndefined } from "jazz-tools";
import type { EdgeInstance, TaskInstance } from "~/integrations/jazz/schema";
import type { BoardStateContextValue } from "./board-state";
import { findSectionX, findSectionY, getEdgeMap, getTaskMap } from "./instance-maps";

type UpdateTaskPositionsArgs = {
  attribute: "positionY" | "positionX";
  shift: number;
  taskMap: Map<string, TaskInstance>;
  startPositions: Map<string, number>;
};

const updateTaskPositions = ({
  startPositions,
  shift,
  attribute,
  taskMap,
}: UpdateTaskPositionsArgs) => {
  for (const [taskId, from] of startPositions.entries()) {
    taskMap.get(taskId)?.$jazz.set(attribute, from + shift);
  }
};

type UpdateEdgePositionsArgs = {
  startPositions: Map<string, number>;
  shift: number;
  edgeMap: Map<string, EdgeInstance>;
};

const updateEdgePositions = ({ startPositions, shift, edgeMap }: UpdateEdgePositionsArgs) => {
  for (const [edgeId, from] of startPositions.entries()) {
    edgeMap.get(edgeId)?.$jazz.set("breakX", from + shift);
  }
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  attribute: "positionY" | "positionX";
  taskMap: Map<string, TaskInstance>;
};

const shiftTasks = ({ shift, position, attribute, taskMap }: ShiftTasksArgs) => {
  const tasksToMove = new Map(
    taskMap.entries().filter(([_taskId, taskPosition]) => taskPosition[attribute] > position),
  );
  const startPositions = new Map(
    tasksToMove.entries().map(([taskId, position]) => [taskId, position[attribute]]),
  );
  updateTaskPositions({
    attribute,
    shift,
    startPositions,
    taskMap: tasksToMove,
  });
};

type ShiftEdgesArgs = {
  shift: number;
  position: number;
  edgeMap: Map<string, EdgeInstance>;
};

const shiftEdges = ({ shift, position, edgeMap }: ShiftEdgesArgs) => {
  const edgesToMove = new Map(
    edgeMap.entries().filter(([_edgeId, edgeSize]) => edgeSize.breakX > position),
  );
  const startPositions = new Map(
    edgesToMove.entries().map(([edgeId, size]) => [edgeId, size.breakX]),
  );
  updateEdgePositions({
    edgeMap: edgeMap,
    shift,
    startPositions,
  });
};

export type InsertHorizontalSectionInstance = {
  boardState: BoardStateContextValue;
  name: string;
  index: number;
};

export const insertHorizontalSectionInstance = ({
  name,
  index,
  boardState,
}: InsertHorizontalSectionInstance) => {
  const board = boardState.board();
  const edgeMap = getEdgeMap(board);
  const taskMap = getTaskMap(board);
  const position = boardState.sectionXConfigs()[index].end;
  const shift = 500;

  getLoadedOrUndefined(board.sectionX)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
  });

  shiftTasks({ attribute: "positionX", position, shift, taskMap: taskMap });
  shiftEdges({ edgeMap, position, shift });
};

export type InsertVerticalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  name: string;
  index: number;
};

export const insertVerticalSectionInstance = ({
  boardState,
  name,
  index,
}: InsertVerticalSectionInstanceArgs) => {
  const board = boardState.board();
  const taskMap = getTaskMap(board);
  const position = boardState.sectionYConfigs()[index].end;
  const shift = 500;

  getLoadedOrUndefined(board.sectionY)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
  });

  shiftTasks({ attribute: "positionY", position, shift, taskMap: taskMap });
};

export type UpdateHorizontalSectionInstanceSizeArgs = {
  boardState: BoardStateContextValue;
  position: number;
  draggedTasks: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionId: string;
};

export const updateHorizontalSectionInstanceSize = ({
  boardState,
  sectionId,
  position,
  draggedTasks,
  startPosition,
  sectionStart,
}: UpdateHorizontalSectionInstanceSizeArgs) => {
  const board = boardState.board();
  const section = findSectionY(board, sectionId);
  const taskMap = getTaskMap(board);

  section?.$jazz.set("size", position - sectionStart);
  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionY",
    shift,
    startPositions: draggedTasks,
    taskMap: taskMap,
  });
};

export type UpdateVerticalSectionInstanceSizeArgs = {
  boardState: BoardStateContextValue;
  position: number;
  draggedTasks: Map<string, number>;
  draggedEdges: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionId: string;
};

export const updateVerticalSectionInstanceSize = ({
  boardState,
  position,
  draggedTasks,
  draggedEdges,
  startPosition,
  sectionStart,
  sectionId,
}: UpdateVerticalSectionInstanceSizeArgs) => {
  const board = boardState.board();
  const edgeMap = getEdgeMap(board);
  const taskMap = getTaskMap(board);
  const section = findSectionX(board, sectionId);
  const shift = position - startPosition;

  section?.$jazz.set("size", position - sectionStart);

  updateTaskPositions({
    attribute: "positionX",
    shift,
    startPositions: draggedTasks,
    taskMap,
  });
  updateEdgePositions({
    edgeMap,
    shift,
    startPositions: draggedEdges,
  });
};

export type DeleteHorizontalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  sectionId: string;
  endPosition: number;
  shift: number;
};

export const deleteHorizontalSectionInstance = ({
  boardState,
  sectionId,
  endPosition,
  shift,
}: DeleteHorizontalSectionInstanceArgs) => {
  const board = boardState.board();
  const edgeMap = getEdgeMap(board);
  const taskMap = getTaskMap(board);

  getLoadedOrUndefined(board.sectionX)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionX", position: endPosition, shift, taskMap: taskMap });
  shiftEdges({ edgeMap, position: endPosition, shift });
};

export type DeleteVerticalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  sectionId: string;
  endPosition: number;
  shift: number;
};

export const deleteVerticalSectionInstance = ({
  boardState,
  sectionId,
  endPosition,
  shift,
}: DeleteVerticalSectionInstanceArgs) => {
  const board = boardState.board();
  const taskMap = getTaskMap(board);

  getLoadedOrUndefined(board.sectionY)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionY", position: endPosition, shift, taskMap: taskMap });
};

export type UpdateHorizontalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  name: string;
  sectionId: string;
};

export const updateHorizontalSectionInstance = ({
  boardState,
  sectionId,
  name,
}: UpdateHorizontalSectionInstanceArgs) => {
  const board = boardState.board();
  const section = findSectionX(board, sectionId);

  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

export type UpdateVerticalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  name: string;
  sectionId: string;
};

export const updateVerticalSectionInstance = ({
  boardState,
  sectionId,
  name,
}: UpdateVerticalSectionInstanceArgs) => {
  const board = boardState.board();
  const section = findSectionY(board, sectionId);

  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

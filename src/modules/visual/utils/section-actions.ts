import { getLoadedOrUndefined } from "jazz-tools";
import type { EdgeInstance, TaskInstance } from "~/integrations/jazz/schema";
import type { BoardStateContextValue } from "../contexts/board-state";
import { getEdgeMap, getSectionXMap, getSectionYMap, getTaskMap } from "./instance-maps";

type UpdateTaskPositionsArgs = {
  attribute: "positionY" | "positionX";
  shift: number;
  taskPositions: Map<string, TaskInstance>;
  startPositions: Map<string, number>;
};

const updateTaskPositions = ({
  startPositions,
  shift,
  attribute,
  taskPositions,
}: UpdateTaskPositionsArgs) => {
  for (const [taskId, from] of startPositions.entries()) {
    taskPositions.get(taskId)?.$jazz.set(attribute, from + shift);
  }
};

type UpdateEdgePositionsArgs = {
  startPositions: Map<string, number>;
  shift: number;
  edgePositions: Map<string, EdgeInstance>;
};

const updateEdgePositions = ({ startPositions, shift, edgePositions }: UpdateEdgePositionsArgs) => {
  for (const [edgeId, from] of startPositions.entries()) {
    edgePositions.get(edgeId)?.$jazz.set("breakX", from + shift);
  }
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  attribute: "positionY" | "positionX";
  taskPositions: Map<string, TaskInstance>;
};

const shiftTasks = ({ shift, position, attribute, taskPositions }: ShiftTasksArgs) => {
  const tasksToMove = new Map(
    taskPositions.entries().filter(([_taskId, taskPosition]) => taskPosition[attribute] > position),
  );
  const startPositions = new Map(
    tasksToMove.entries().map(([taskId, position]) => [taskId, position[attribute]]),
  );
  updateTaskPositions({
    attribute,
    shift,
    startPositions,
    taskPositions: tasksToMove,
  });
};

type ShiftEdgesArgs = {
  shift: number;
  position: number;
  edgePositions: Map<string, EdgeInstance>;
};

const shiftEdges = ({ shift, position, edgePositions }: ShiftEdgesArgs) => {
  const edgesToMove = new Map(
    edgePositions.entries().filter(([_edgeId, edgeSize]) => edgeSize.breakX > position),
  );
  const startPositions = new Map(
    edgesToMove.entries().map(([edgeId, size]) => [edgeId, size.breakX]),
  );
  updateEdgePositions({
    edgePositions,
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
  const shift = 500;
  const edgePositions = getEdgeMap(board);
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionX)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
    tasks: [],
  });

  const position = boardState.sectionXConfigs()[index].end;
  shiftTasks({ attribute: "positionX", position, shift, taskPositions });
  shiftEdges({ edgePositions, position, shift });
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
  const shift = 500;
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionY)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
    tasks: [],
  });

  const position = boardState.sectionYConfigs()[index].end;
  shiftTasks({ attribute: "positionY", position, shift, taskPositions });
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
  const sectionsYMap = getSectionYMap(board);
  const taskPositions = getTaskMap(board);
  const sectionSize = sectionsYMap.get(sectionId);

  sectionSize?.$jazz.set("size", position - sectionStart);
  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionY",
    shift,
    startPositions: draggedTasks,
    taskPositions,
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
  const edgePositions = getEdgeMap(board);
  const taskPositions = getTaskMap(board);
  const sectionsXMap = getSectionXMap(board);
  const sectionSize = sectionsXMap.get(sectionId);

  sectionSize?.$jazz.set("size", position - sectionStart);

  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionX",
    shift,
    startPositions: draggedTasks,
    taskPositions,
  });
  updateEdgePositions({
    edgePositions,
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
  const edgePositions = getEdgeMap(board);
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionX)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionX", position: endPosition, shift, taskPositions });
  shiftEdges({ edgePositions, position: endPosition, shift });
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
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionY)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionY", position: endPosition, shift, taskPositions });
};

export type UpdateHorizontalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  name: string;
  id: string;
};

export const updateHorizontalSectionInstance = ({
  boardState,
  id,
  name,
}: UpdateHorizontalSectionInstanceArgs) => {
  const board = boardState.board();
  const sections = getLoadedOrUndefined(board.sectionX);
  const section = sections?.find((section) => section.$jazz.id === id);
  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

export type UpdateVerticalSectionInstanceArgs = {
  boardState: BoardStateContextValue;
  name: string;
  id: string;
};

export const updateVerticalSectionInstance = ({
  boardState,
  id,
  name,
}: UpdateVerticalSectionInstanceArgs) => {
  const board = boardState.board();
  const sections = getLoadedOrUndefined(board.sectionY);
  const section = sections?.find((section) => section.$jazz.id === id);
  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

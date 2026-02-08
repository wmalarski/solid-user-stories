import { getLoadedOrUndefined } from "jazz-tools";
import type { BoardInstance, EdgeInstance, TaskInstance } from "~/integrations/jazz/schema";
import { getEdgeMap, getSectionXMap, getSectionYMap, getTaskMap } from "./instance-maps";
import type { SectionConfigs } from "./section-configs";

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
  board: BoardInstance;
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
};

export const insertHorizontalSectionInstance = ({
  name,
  index,
  sectionConfigs,
  board,
}: InsertHorizontalSectionInstance) => {
  const shift = 500;
  const edgePositions = getEdgeMap(board);
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionX)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
    tasks: [],
  });

  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "positionX", position, shift, taskPositions });
  shiftEdges({ edgePositions, position, shift });
};

export type InsertVerticalSectionInstanceArgs = {
  board: BoardInstance;
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
};

export const insertVerticalSectionInstance = ({
  board,
  name,
  index,
  sectionConfigs,
}: InsertVerticalSectionInstanceArgs) => {
  const shift = 500;
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionY)?.$jazz.splice(index + 1, 0, {
    name,
    size: shift,
    tasks: [],
  });

  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "positionY", position, shift, taskPositions });
};

export type UpdateHorizontalSectionInstanceSizeArgs = {
  board: BoardInstance;
  position: number;
  draggedTasks: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionId: string;
};

export const updateHorizontalSectionInstanceSize = ({
  board,
  sectionId,
  position,
  draggedTasks,
  startPosition,
  sectionStart,
}: UpdateHorizontalSectionInstanceSizeArgs) => {
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
  board: BoardInstance;
  position: number;
  draggedTasks: Map<string, number>;
  draggedEdges: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionId: string;
};

export const updateVerticalSectionInstanceSize = ({
  board,
  position,
  draggedTasks,
  draggedEdges,
  startPosition,
  sectionStart,
  sectionId,
}: UpdateVerticalSectionInstanceSizeArgs) => {
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
  board: BoardInstance;
  sectionId: string;
  endPosition: number;
  shift: number;
};

export const deleteHorizontalSectionInstance = ({
  board,
  sectionId,
  endPosition,
  shift,
}: DeleteHorizontalSectionInstanceArgs) => {
  const edgePositions = getEdgeMap(board);
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionX)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionX", position: endPosition, shift, taskPositions });
  shiftEdges({ edgePositions, position: endPosition, shift });
};

export type DeleteVerticalSectionInstanceArgs = {
  board: BoardInstance;
  sectionId: string;
  endPosition: number;
  shift: number;
};

export const deleteVerticalSectionInstance = ({
  board,
  sectionId,
  endPosition,
  shift,
}: DeleteVerticalSectionInstanceArgs) => {
  const taskPositions = getTaskMap(board);

  getLoadedOrUndefined(board.sectionY)?.$jazz.remove((section) => section.$jazz.id === sectionId);
  shiftTasks({ attribute: "positionY", position: endPosition, shift, taskPositions });
};

export type UpdateHorizontalSectionInstanceArgs = {
  board: BoardInstance;
  name: string;
  id: string;
};

export const updateHorizontalSectionInstance = ({
  board,
  id,
  name,
}: UpdateHorizontalSectionInstanceArgs) => {
  const sections = getLoadedOrUndefined(board.sectionX);
  const section = sections?.find((section) => section.$jazz.id === id);
  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

export type UpdateVerticalSectionInstanceArgs = {
  board: BoardInstance;
  name: string;
  id: string;
};

export const updateVerticalSectionInstance = ({
  board,
  id,
  name,
}: UpdateVerticalSectionInstanceArgs) => {
  const sections = getLoadedOrUndefined(board.sectionY);
  const section = sections?.find((section) => section.$jazz.id === id);
  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

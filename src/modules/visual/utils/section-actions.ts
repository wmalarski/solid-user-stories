import { getLoadedOrUndefined } from "jazz-tools";
import type {
  BoardInstance,
  EdgeInstance,
  SectionInstance,
  TaskInstance,
} from "~/integrations/jazz/schema";
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

type InsertHorizontalSectionAndShiftArgs = {
  board: BoardInstance;
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
  taskPositions: Map<string, TaskInstance>;
  edgePositions: Map<string, EdgeInstance>;
};

export const insertHorizonalSectionAndShift = ({
  name,
  index,
  sectionConfigs,
  taskPositions,
  edgePositions,
  board,
}: InsertHorizontalSectionAndShiftArgs) => {
  const shift = 500;
  const orientation = "horizontal";

  getLoadedOrUndefined(board.sectionX)?.$jazz.splice(index + 1, 0, {
    name,
    orientation,
    size: shift,
    tasks: [],
  });
  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "positionX", position, shift, taskPositions });
  shiftEdges({ edgePositions, position, shift });
};

type InsertVerticalSectionAndShiftArgs = {
  board: BoardInstance;
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
  taskPositions: Map<string, TaskInstance>;
};

export const insertVerticalSectionAndShift = ({
  board,
  name,
  index,
  sectionConfigs,
  taskPositions,
}: InsertVerticalSectionAndShiftArgs) => {
  const shift = 500;
  const orientation = "vertical";
  getLoadedOrUndefined(board.sectionY)?.$jazz.splice(index + 1, 0, {
    name,
    orientation,
    size: shift,
    tasks: [],
  });
  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "positionY", position, shift, taskPositions });
};

type UpdateHorizontalSectionSizeArgs = {
  position: number;
  draggedTasks: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionSize: SectionInstance;
  taskPositions: Map<string, TaskInstance>;
};

export const updateHorizontalSectionSize = ({
  position,
  draggedTasks,
  startPosition,
  sectionStart,
  sectionSize,
  taskPositions,
}: UpdateHorizontalSectionSizeArgs) => {
  sectionSize.$jazz.set("size", position - sectionStart);
  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionY",
    shift,
    startPositions: draggedTasks,
    taskPositions,
  });
};

type UpdateVerticalSectionSizeArgs = {
  position: number;
  draggedTasks: Map<string, number>;
  draggedEdges: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionSize: SectionInstance;
  taskPositions: Map<string, TaskInstance>;
  edgePositions: Map<string, EdgeInstance>;
};

export const updateVerticalSectionSize = ({
  position,
  draggedTasks,
  draggedEdges,
  startPosition,
  sectionStart,
  taskPositions,
  edgePositions,
  sectionSize,
}: UpdateVerticalSectionSizeArgs) => {
  sectionSize.$jazz.set("size", position - sectionStart);

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

type DeleteSectionAndShiftArgs = {
  board: BoardInstance;
  sectionId: string;
  orientation: SectionInstance["orientation"];
  endPosition: number;
  shift: number;
  taskPositions: Map<string, TaskInstance>;
  edgePositions: Map<string, EdgeInstance>;
};

export const deleteSectionAndShift = ({
  board,
  sectionId,
  orientation,
  endPosition,
  shift,
  taskPositions,
  edgePositions,
}: DeleteSectionAndShiftArgs) => {
  if (orientation === "horizontal") {
    getLoadedOrUndefined(board.sectionX)?.$jazz.remove((section) => section.$jazz.id === sectionId);
    shiftTasks({ attribute: "positionX", position: endPosition, shift, taskPositions });
    shiftEdges({ edgePositions, position: endPosition, shift });
  } else {
    getLoadedOrUndefined(board.sectionY)?.$jazz.remove((section) => section.$jazz.id === sectionId);
    shiftTasks({ attribute: "positionY", position: endPosition, shift, taskPositions });
  }
};

type UpdateSectionDataArgs = {
  board: BoardInstance;
  name: string;
  id: string;
  orientation: SectionInstance["orientation"];
};

export const updateSectionData = ({ board, id, name, orientation }: UpdateSectionDataArgs) => {
  const sections = getLoadedOrUndefined(
    board[orientation === "horizontal" ? "sectionX" : "sectionY"],
  );
  const section = sections?.find((section) => section.$jazz.id === id);
  getLoadedOrUndefined(section)?.$jazz.set("name", name);
};

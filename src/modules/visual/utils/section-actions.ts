import type {
  EdgeBreakInstance,
  SectionInput,
  SectionInstance,
  SectionListInstance,
  SectionSizeInstance,
  TaskPositionInstance,
} from "~/integrations/jazz/schema";
import type { SectionConfigs } from "./section-configs";

type UpdateTaskPositionsArgs = {
  attribute: "y" | "x";
  shift: number;
  taskPositions: Map<string, TaskPositionInstance>;
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
  edgePositions: Map<string, EdgeBreakInstance>;
};

const updateEdgePositions = ({ startPositions, shift, edgePositions }: UpdateEdgePositionsArgs) => {
  for (const [edgeId, from] of startPositions.entries()) {
    edgePositions.get(edgeId)?.$jazz.set("value", from + shift);
  }
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  attribute: "y" | "x";
  taskPositions: Map<string, TaskPositionInstance>;
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
  edgePositions: Map<string, EdgeBreakInstance>;
};

const shiftEdges = ({ shift, position, edgePositions }: ShiftEdgesArgs) => {
  const edgesToMove = new Map(
    edgePositions.entries().filter(([_edgeId, edgeSize]) => edgeSize.value > position),
  );
  const startPositions = new Map(
    edgesToMove.entries().map(([edgeId, size]) => [edgeId, size.value]),
  );
  updateEdgePositions({
    edgePositions,
    shift,
    startPositions,
  });
};

type InsertHorizontalSectionAndShiftArgs = {
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
  sections: SectionListInstance;
  taskPositions: Map<string, TaskPositionInstance>;
  edgePositions: Map<string, EdgeBreakInstance>;
};

export const insertHorizonalSectionAndShift = ({
  name,
  index,
  sectionConfigs,
  sections,
  taskPositions,
  edgePositions,
}: InsertHorizontalSectionAndShiftArgs) => {
  const shift = 500;
  const orientation = "horizontal";
  sections?.$jazz.splice(index + 1, 0, { name, orientation, size: { value: shift }, tasks: [] });
  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "x", position, shift, taskPositions });
  shiftEdges({ edgePositions, position, shift });
};

type InsertVerticalSectionAndShiftArgs = {
  name: string;
  index: number;
  sectionConfigs: SectionConfigs;
  sections: SectionListInstance;
  taskPositions: Map<string, TaskPositionInstance>;
};

export const insertVerticalSectionAndShift = ({
  name,
  index,
  sectionConfigs,
  sections,
  taskPositions,
}: InsertVerticalSectionAndShiftArgs) => {
  const shift = 500;
  const orientation = "vertical";
  sections?.$jazz.splice(index + 1, 0, { name, orientation, size: { value: shift }, tasks: [] });
  const position = sectionConfigs[index].end;
  shiftTasks({ attribute: "y", position, shift, taskPositions });
};

type UpdateHorizontalSectionSizeArgs = {
  position: number;
  draggedTasks: Map<string, number>;
  startPosition: number;
  sectionStart: number;
  sectionSize: SectionSizeInstance;
  taskPositions: Map<string, TaskPositionInstance>;
};

export const updateHorizontalSectionSize = ({
  position,
  draggedTasks,
  startPosition,
  sectionStart,
  sectionSize,
  taskPositions,
}: UpdateHorizontalSectionSizeArgs) => {
  sectionSize.$jazz.set("value", position - sectionStart);
  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "y",
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
  sectionSize: SectionSizeInstance;
  taskPositions: Map<string, TaskPositionInstance>;
  edgePositions: Map<string, EdgeBreakInstance>;
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
  sectionSize.$jazz.set("value", position - sectionStart);

  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "x",
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
  sectionId: string;
  orientation: SectionInstance["orientation"];
  endPosition: number;
  shift: number;
  sectionsX: SectionListInstance;
  sectionsY: SectionListInstance;
  taskPositions: Map<string, TaskPositionInstance>;
  edgePositions: Map<string, EdgeBreakInstance>;
};

export const deleteSectionAndShift = ({
  sectionId,
  orientation,
  endPosition,
  shift,
  sectionsX,
  sectionsY,
  taskPositions,
  edgePositions,
}: DeleteSectionAndShiftArgs) => {
  if (orientation === "horizontal") {
    sectionsX.$jazz.remove((section) => section.$jazz.id === sectionId);
    shiftTasks({ attribute: "x", position: endPosition, shift, taskPositions });
    shiftEdges({ edgePositions, position: endPosition, shift });
  } else {
    sectionsY.$jazz.remove((section) => section.$jazz.id === sectionId);
    shiftTasks({ attribute: "y", position: endPosition, shift, taskPositions });
  }
};

export const updateSectionData = (
  instance: SectionInstance,
  section: Pick<SectionInput, "name">,
) => {
  instance.$jazz.set("name", section.name);
};

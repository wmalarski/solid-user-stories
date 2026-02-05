import type {
  BoardsCollection,
  EdgeCollection,
  SectionCollection,
  TaskCollection,
} from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { SectionModel, TaskModel } from "~/integrations/tanstack-db/schema";
import type { EdgeEntry } from "../contexts/board-state";
import type { SectionConfigs } from "./section-configs";

type UpdateTaskPositionsArgs = {
  update: Map<string, number>;
  shift: number;
  attribute: "positionY" | "positionX";
  taskCollection: TaskCollection;
};

const updateTaskPositions = ({
  update,
  shift,
  attribute,
  taskCollection,
}: UpdateTaskPositionsArgs) => {
  if (update.size > 0) {
    taskCollection.update([...update.keys()], (drafts) => {
      for (const draft of drafts) {
        const position = update.get(draft.id) ?? draft[attribute];
        draft[attribute] = position + shift;
      }
    });
  }
};

type UpdateEdgePositionsArgs = {
  update: Map<string, number>;
  shift: number;
  edgeCollection: EdgeCollection;
};

const updateEdgePositions = ({ edgeCollection, update, shift }: UpdateEdgePositionsArgs) => {
  if (update.size > 0) {
    edgeCollection.update([...update.keys()], (drafts) => {
      for (const draft of drafts) {
        const position = update.get(draft.id) ?? draft.breakX;
        draft.breakX = position + shift;
      }
    });
  }
};

type ShiftSectionArgs = {
  index: number;
  sectionId: string;
  boardId: string;
  sectionConfigs: SectionConfigs;
  attribute: "x" | "y";
  boardsCollection: BoardsCollection;
};

const shiftSections = ({
  attribute,
  index,
  boardId,
  sectionId,
  boardsCollection,
  sectionConfigs,
}: ShiftSectionArgs) => {
  const sectionIds = sectionConfigs[attribute].map((config) => config.section.id);
  sectionIds.splice(index + 1, 0, sectionId);
  const key = attribute === "x" ? "sectionXOrder" : "sectionYOrder";
  boardsCollection.update(boardId, (draft) => {
    draft[key] = sectionIds;
  });
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  tasks: TaskModel[];
  attribute: "positionY" | "positionX";
  taskCollection: TaskCollection;
};

const shiftTasks = ({ shift, tasks, position, attribute, taskCollection }: ShiftTasksArgs) => {
  const tasksToMove = tasks.filter((entry) => entry[attribute] > position).map((entry) => entry.id);

  if (tasksToMove.length > 0) {
    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft[attribute] += shift;
      }
    });
  }
};

type ShiftEdgesArgs = {
  shift: number;
  position: number;
  edges: EdgeEntry[];
  edgeCollection: EdgeCollection;
};

const shiftEdges = ({ shift, edges, position, edgeCollection }: ShiftEdgesArgs) => {
  const egesToMove = edges
    .filter((entry) => entry.edge.breakX > position)
    .map((entry) => entry.edge.id);

  if (egesToMove.length > 0) {
    edgeCollection.update(egesToMove, (drafts) => {
      for (const draft of drafts) {
        draft.breakX += shift;
      }
    });
  }
};

type InsertSectionAndShiftArgs = {
  sectionCollection: SectionCollection;
  edgeCollection: EdgeCollection;
  taskCollection: TaskCollection;
  boardsCollection: BoardsCollection;
  boardId: string;
  name: string;
  orientation: SectionModel["orientation"];
  index: number;
  tasks: TaskModel[];
  edges: EdgeEntry[];
  sectionConfigs: SectionConfigs;
};

export const insertSectionAndShift = ({
  sectionCollection,
  edgeCollection,
  taskCollection,
  boardsCollection,
  boardId,
  name,
  orientation,
  index,
  tasks,
  edges,
  sectionConfigs,
}: InsertSectionAndShiftArgs) => {
  const shift = 500;
  const sectionId = createId();
  sectionCollection.insert({ boardId, id: sectionId, name, orientation, size: shift });

  if (orientation === "horizontal") {
    const position = sectionConfigs.x[index].end;
    shiftTasks({ attribute: "positionX", position, shift, taskCollection, tasks });
    shiftEdges({ edgeCollection, edges, position, shift });
    shiftSections({
      attribute: "x",
      boardId,
      boardsCollection,
      index,
      sectionConfigs,
      sectionId,
    });
  } else {
    const position = sectionConfigs.y[index].end;
    shiftTasks({ attribute: "positionY", position, shift, taskCollection, tasks });
    shiftSections({
      attribute: "y",
      boardId,
      boardsCollection,
      index,
      sectionConfigs,
      sectionId,
    });
  }
};

type UpdateHorizontalSectionSizeArgs = {
  sectionCollection: SectionCollection;
  taskCollection: TaskCollection;
  position: number;
  draggedTasks: Map<string, number>;
  sectionId: string;
  startPosition: number;
  sectionStart: number;
};

export const updateHorizontalSectionSize = ({
  sectionCollection,
  taskCollection,
  position,
  draggedTasks,
  sectionId,
  startPosition,
  sectionStart,
}: UpdateHorizontalSectionSizeArgs) => {
  const size = position - sectionStart;

  sectionCollection.update(sectionId, (draft) => {
    draft.size = size;
  });

  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionY",
    shift,
    taskCollection,
    update: draggedTasks,
  });
};

type UpdateVerticalSectionSizeArgs = {
  sectionCollection: SectionCollection;
  taskCollection: TaskCollection;
  edgeCollection: EdgeCollection;
  position: number;
  draggedTasks: Map<string, number>;
  draggedEdges: Map<string, number>;
  sectionId: string;
  startPosition: number;
  sectionStart: number;
};

export const updateVerticalSectionSize = ({
  sectionCollection,
  taskCollection,
  edgeCollection,
  position,
  draggedTasks,
  draggedEdges,
  sectionId,
  startPosition,
  sectionStart,
}: UpdateVerticalSectionSizeArgs) => {
  const size = position - sectionStart;

  sectionCollection.update(sectionId, (draft) => {
    draft.size = size;
  });

  const shift = position - startPosition;

  updateTaskPositions({
    attribute: "positionX",
    shift,
    taskCollection,
    update: draggedTasks,
  });
  updateEdgePositions({ edgeCollection, shift, update: draggedEdges });
};

type DeleteSectionAndShiftArgs = {
  sectionCollection: SectionCollection;
  edgeCollection: EdgeCollection;
  taskCollection: TaskCollection;
  boardsCollection: BoardsCollection;
  boardId: string;
  sectionId: string;
  orientation: SectionModel["orientation"];
  endPosition: number;
  shift: number;
  tasks: TaskModel[];
  edges: EdgeEntry[];
};

export const deleteSectionAndShift = ({
  boardsCollection,
  edgeCollection,
  sectionCollection,
  taskCollection,
  boardId,
  sectionId,
  orientation,
  endPosition,
  shift,
  edges,
  tasks,
}: DeleteSectionAndShiftArgs) => {
  boardsCollection.update(boardId, (draft) => {
    draft.sectionXOrder = draft.sectionXOrder.filter((id) => id !== sectionId);
    draft.sectionYOrder = draft.sectionYOrder.filter((id) => id !== sectionId);
  });

  if (orientation === "horizontal") {
    shiftTasks({ attribute: "positionX", position: endPosition, shift, taskCollection, tasks });
    shiftEdges({ edgeCollection, edges, position: endPosition, shift });
  } else {
    shiftTasks({ attribute: "positionY", position: endPosition, shift, taskCollection, tasks });
  }

  sectionCollection.delete(sectionId);
};

import { getLoadedOrUndefined, type MaybeLoaded } from "jazz-tools";
import type {
  BoardInstance,
  EdgeInstance,
  EdgeListInstance,
  SectionInstance,
  SectionListInstance,
  TaskInstance,
  TaskListInstance,
} from "~/integrations/jazz/schema";
import type { Point2D } from "../utils/types";

export type SectionModel = {
  id: string;
  sizeId: string;
  name: string;
  orientation: "horizontal" | "vertical";
  size: number;
};

export type TaskModel = {
  id: string;
  positionId: string;
  description: string;
  estimate: number;
  link?: string;
  position: Point2D;
  sectionX: string | null;
  sectionY: string | null;
  sourceEdges: string[];
  targetEdges: string[];
  title: string;
};

export type EdgeModel = {
  id: string;
  positionId: string;
  breakX: number;
  source: string;
  target: string;
};

export type BoardModel = {
  edges: EdgeModel[];
  tasks: TaskModel[];
  sectionsX: SectionModel[];
  sectionsY: SectionModel[];
};

export const mapToBoardModel = (board: BoardInstance): BoardModel => {
  return {
    edges: mapToEdgeModels(board.edges),
    sectionsX: mapToSectionModels(board.sectionX),
    sectionsY: mapToSectionModels(board.sectionY),
    tasks: mapToTaskModels(board.tasks),
  };
};

export const mapToEdgeModels = (edges: MaybeLoaded<EdgeListInstance>): EdgeModel[] => {
  return (
    getLoadedOrUndefined(edges)?.flatMap((edge): EdgeModel[] => {
      const model = mapToEdgeModel(edge);
      return model ? [model] : [];
    }) ?? []
  );
};

const mapToEdgeModel = (edge: MaybeLoaded<EdgeInstance>): EdgeModel | null => {
  const loaded = getLoadedOrUndefined(edge);
  const loadedBreak = loaded && getLoadedOrUndefined(loaded.breakX);

  if (!loaded || !loadedBreak) {
    return null;
  }

  return {
    breakX: loadedBreak.value,
    id: edge.$jazz.id,
    positionId: loaded.breakX.$jazz.id,
    source: loaded.source,
    target: loaded.target,
  };
};

export const mapToSectionModels = (sections: MaybeLoaded<SectionListInstance>): SectionModel[] => {
  return (
    getLoadedOrUndefined(sections)?.flatMap((section): SectionModel[] => {
      const model = mapToSectionModel(section);
      return model ? [model] : [];
    }) ?? []
  );
};

const mapToSectionModel = (section: MaybeLoaded<SectionInstance>): SectionModel | null => {
  const loaded = getLoadedOrUndefined(section);
  const loadedSize = loaded && getLoadedOrUndefined(loaded.size);

  if (!loaded || !loadedSize) {
    return null;
  }

  return {
    id: section.$jazz.id,
    name: loaded.name,
    orientation: loaded.orientation,
    size: loadedSize.value,
    sizeId: loaded.size.$jazz.id,
  };
};

export const mapToTaskModels = (tasks: MaybeLoaded<TaskListInstance>): TaskModel[] => {
  return (
    getLoadedOrUndefined(tasks)?.flatMap((task): TaskModel[] => {
      const model = mapToTaskModel(task);
      return model ? [model] : [];
    }) ?? []
  );
};

const mapToTaskModel = (task: MaybeLoaded<TaskInstance>): TaskModel | null => {
  const loaded = getLoadedOrUndefined(task);
  const loadedPosition = loaded && getLoadedOrUndefined(loaded.position);

  if (!loaded || !loadedPosition) {
    return null;
  }

  return {
    description: loaded.description,
    estimate: loaded.estimate,
    id: task.$jazz.id,
    link: loaded.link,
    position: {
      x: loadedPosition.x,
      y: loadedPosition.y,
    },
    positionId: loaded.position.$jazz.id,
    sectionX: loaded.sectionX,
    sectionY: loaded.sectionY,
    sourceEdges: loaded.sourceEdges,
    targetEdges: loaded.targetEdges,
    title: loaded.title,
  };
};

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

export type Orientation = "horizontal" | "vertical";

export type SectionModel = {
  id: string;
  name: string;
  size: number;
};

export type TaskModel = {
  id: string;
  description: string;
  estimate: number;
  link?: string;
  positionX: number;
  positionY: number;
  sectionX: string | null;
  sectionY: string | null;
  title: string;
};

export type EdgeModel = {
  id: string;
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

  if (!loaded) {
    return null;
  }

  return {
    breakX: loaded.breakX,
    id: edge.$jazz.id,
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

  if (!loaded) {
    return null;
  }

  return {
    id: section.$jazz.id,
    name: loaded.name,
    size: loaded.size,
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

  if (!loaded) {
    return null;
  }

  return {
    description: loaded.description,
    estimate: loaded.estimate,
    id: task.$jazz.id,
    link: loaded.link,
    positionX: loaded.positionX,
    positionY: loaded.positionY,
    sectionX: loaded.sectionX,
    sectionY: loaded.sectionY,
    title: loaded.title,
  };
};

import { getLoadedOrUndefined, type MaybeLoaded } from "jazz-tools";
import type {
  BoardInstance,
  CursorFeedSchemaInstance,
  EdgeInstance,
  EdgeInstanceInput,
  EdgeListInstance,
  SectionInstance,
  SectionInstanceInput,
  SectionListInstance,
  TaskInstance,
  TaskInstanceInput,
  TaskListInstance,
} from "~/integrations/jazz/schema";

export type WithId<T> = T & { id: string };

export type SectionModel = WithId<SectionInstanceInput>;
export type TaskModel = WithId<TaskInstanceInput>;
export type EdgeModel = WithId<EdgeInstanceInput>;

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

export type CursorModel = {
  x: number;
  y: number;
  name?: string;
  madeAt: Date;
  sessionId: string;
};

export const mapToCursorModel = (cursors: MaybeLoaded<CursorFeedSchemaInstance>) => {
  const loadedCursors = getLoadedOrUndefined(cursors);
  const entries = Object.entries(loadedCursors?.perSession ?? {});
  return entries.map(
    ([sessionId, cursor]): CursorModel => ({
      madeAt: cursor.madeAt,
      name: getLoadedOrUndefined(cursor.by?.profile)?.name,
      sessionId,
      x: cursor.value.position.x,
      y: cursor.value.position.y,
    }),
  );
};

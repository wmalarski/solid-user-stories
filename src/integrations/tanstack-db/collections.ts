import { createCollection, localStorageCollectionOptions } from "@tanstack/solid-db";
import { AxisSchema, BoardSchema, EdgeSchema, TaskSchema } from "./schema";

export const boardsCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "boards",
    schema: BoardSchema,
    storageKey: "app-boards",
  }),
);

export const taskCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "tasks",
    schema: TaskSchema,
    storageKey: "app-tasks",
  }),
);

export const edgeCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "edges",
    schema: EdgeSchema,
    storageKey: "app-edges",
  }),
);

export const axisCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "axis",
    schema: AxisSchema,
    storageKey: "app-axis",
  }),
);

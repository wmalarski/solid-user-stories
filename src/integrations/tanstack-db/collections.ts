import { createCollection, localStorageCollectionOptions } from "@tanstack/solid-db";
import { BoardSchema, EdgeSchema, SectionSchema, TaskSchema } from "./schema";
import { webSocketCollectionOptions } from "./websocket-collection";

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

export const sectionCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "sections",
    schema: SectionSchema,
    storageKey: "app-sections",
  }),
);

export const boardsCollection = createCollection(
  localStorageCollectionOptions({
    getKey: (item) => item.id,
    id: "boards",
    schema: BoardSchema,
    storageKey: "app-boards",
  }),
);

export const gamesCollection = createCollection(
  webSocketCollectionOptions({
    getKey: (item) => item.id,
    id: "games",
    schema: BoardSchema,
    url: "/websocket/games",
  }),
);

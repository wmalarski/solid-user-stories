import { co } from "jazz-tools";
import * as v from "valibot";

export const TaskSchema = co.map({
  boardId: v.string(),
  description: v.string(),
  estimate: v.number(),
  id: v.string(),
  link: v.optional(v.string()),
  positionX: v.number(),
  positionY: v.number(),
  sectionX: v.nullable(v.string()),
  sectionY: v.nullable(v.string()),
  title: v.string(),
});

export const EdgeSchema = co.map({
  boardId: v.string(),
  breakX: v.number(),
  id: v.string(),
  source: v.string(),
  target: v.string(),
});

export const SectionSchema = co.map({
  boardId: v.string(),
  id: v.string(),
  name: v.string(),
  orientation: v.union([v.literal("horizontal"), v.literal("vertical")]),
  size: v.number(),
});

export const BoardSchema = co.map({
  description: v.string(),
  edges: co.list(EdgeSchema),
  id: v.string(),
  sectionXOrder: v.array(v.string()),
  sectionYOrder: v.array(v.string()),
  sections: co.list(SectionSchema),
  tasks: co.list(TaskSchema),
  title: v.string(),
  user: v.string(),
});

export const BoardsRoot = co.list(BoardSchema);

export const BoardAccountRoot = co.map({
  boards: BoardsRoot,
});

export const BoardAccount = co
  .account({
    profile: co.profile(),
    root: BoardAccountRoot,
  })
  .withMigration((account) => {
    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        boards: [],
      });
    }
  });

import { co, z } from "jazz-tools";

export const TaskSchema = co.map({
  boardId: z.string(),
  description: z.string(),
  estimate: z.number(),
  id: z.string(),
  link: z.optional(z.string()),
  positionX: z.number(),
  positionY: z.number(),
  sectionX: z.string().nullable(),
  sectionY: z.string().nullable(),
  title: z.string(),
});

export const EdgeSchema = co.map({
  boardId: z.string(),
  breakX: z.number(),
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

export const SectionSchema = co.map({
  boardId: z.string(),
  id: z.string(),
  name: z.string(),
  orientation: z.union([z.literal("horizontal"), z.literal("vertical")]),
  size: z.number(),
});

export const BoardSchema = co.map({
  description: z.string(),
  edges: co.list(EdgeSchema),
  id: z.string(),
  sectionXOrder: z.array(z.string()),
  sectionYOrder: z.array(z.string()),
  sections: co.list(SectionSchema),
  tasks: co.list(TaskSchema),
  title: z.string(),
  user: z.string(),
});

export const BoardAccountRoot = co.map({
  boards: co.list(BoardSchema),
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

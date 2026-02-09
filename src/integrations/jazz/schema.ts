import { co, z } from "jazz-tools";

export const SectionSchema = co.map({
  name: z.string(),
  size: z.number(),
});

export const TaskSchema = co.map({
  description: z.string(),
  estimate: z.number(),
  link: z.string().optional(),
  positionX: z.number(),
  positionY: z.number(),
  sectionX: z.string().nullable(),
  sectionY: z.string().nullable(),
  title: z.string(),
});

export const EdgeSchema = co.map({
  breakX: z.number(),
  source: z.string(),
  target: z.string(),
});

export const EdgesListSchema = co.list(EdgeSchema);

export const SectionListSchema = co.list(SectionSchema);

export const TaskListSchema = co.list(TaskSchema);

export const BoardSchema = co.map({
  description: z.string(),
  edges: EdgesListSchema,
  sectionX: SectionListSchema,
  sectionY: SectionListSchema,
  tasks: TaskListSchema,
  title: z.string(),
});

export const BoardsListSchema = co.list(BoardSchema);

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

export type SectionInstance = co.loaded<typeof SectionSchema>;
export type SectionListInstance = co.loaded<typeof SectionListSchema>;
export type EdgeInstance = co.loaded<typeof EdgeSchema>;
export type EdgeListInstance = co.loaded<typeof EdgesListSchema>;
export type TaskInstance = co.loaded<typeof TaskSchema>;
export type TaskListInstance = co.loaded<typeof TaskListSchema>;
export type BoardInstance = co.loaded<typeof BoardSchema>;

export type SectionInstanceInput = co.input<typeof SectionSchema>;
export type EdgeInstanceInput = co.input<typeof EdgeSchema>;
export type TaskInstanceInput = co.input<typeof TaskSchema>;

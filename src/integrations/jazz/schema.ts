import { co, z } from "jazz-tools";

export const TaskSchema = co.map({
  description: z.string(),
  estimate: z.number(),
  link: z.optional(z.string()),
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

export const SectionSchema = co.map({
  id: z.string(),
  name: z.string(),
  orientation: z.union([z.literal("horizontal"), z.literal("vertical")]),
  size: z.number(),
});

export const EdgesListSchema = co.list(EdgeSchema);

export const SectionListSchema = co.list(SectionSchema);

export const TaskListSchema = co.list(TaskSchema);

export const BoardSchema = co.map({
  description: z.string(),
  edges: EdgesListSchema,
  sectionXOrder: z.array(z.string()),
  sectionYOrder: z.array(z.string()),
  sections: SectionListSchema,
  tasks: TaskListSchema,
  title: z.string(),
  user: z.string(),
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
export type SectionInput = co.input<typeof SectionSchema>;
export type SectionListInstance = co.loaded<typeof SectionListSchema>;

export type EdgeInstance = co.loaded<typeof EdgeSchema>;
export type EdgeOutput = co.output<typeof EdgeSchema>;
export type EdgeInput = co.input<typeof EdgeSchema>;
export type EdgeListInstance = co.loaded<typeof EdgesListSchema>;

export type TaskInstance = co.loaded<typeof TaskSchema>;
export type TaskInput = co.input<typeof TaskSchema>;
export type TaskListInstance = co.loaded<typeof TaskListSchema>;

export type BoardInstance = co.loaded<typeof BoardSchema>;

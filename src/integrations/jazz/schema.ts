import { co, z } from "jazz-tools";

export const SectionSizeSchema = co.map({
  value: z.number(),
});

export const SectionSchema = co.map({
  name: z.string(),
  orientation: z.union([z.literal("horizontal"), z.literal("vertical")]),
  size: SectionSizeSchema,
  tasks: z.array(z.string()),
});

export const TaskPositionSchema = co.map({
  x: z.number(),
  y: z.number(),
});

export const TaskSchema = co.map({
  description: z.string(),
  estimate: z.number(),
  link: z.string().optional(),
  position: TaskPositionSchema,
  sectionX: z.string().nullable(),
  sectionY: z.string().nullable(),
  sourceEdges: z.array(z.string()),
  targetEdges: z.array(z.string()),
  title: z.string(),
});

export const EdgeBreakSchema = co.map({
  value: z.number(),
});

export const EdgeSchema = co.map({
  breakX: EdgeBreakSchema,
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

export type SectionSizeInstance = co.loaded<typeof SectionSizeSchema>;

export type EdgeInstance = co.loaded<typeof EdgeSchema>;
export type EdgeInput = co.input<typeof EdgeSchema>;
export type EdgeListInstance = co.loaded<typeof EdgesListSchema>;

export type EdgeBreakInstance = co.loaded<typeof EdgeBreakSchema>;

export type TaskPositionInstance = co.loaded<typeof TaskPositionSchema>;

export type TaskInstance = co.loaded<typeof TaskSchema>;
export type TaskInput = co.input<typeof TaskSchema>;
export type TaskListInstance = co.loaded<typeof TaskListSchema>;

export type BoardInstance = co.loaded<typeof BoardSchema>;

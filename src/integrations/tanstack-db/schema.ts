import * as v from "valibot";

export const TaskSchema = v.object({
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

export const EdgeSchema = v.object({
  boardId: v.string(),
  breakX: v.number(),
  id: v.string(),
  source: v.string(),
  target: v.string(),
});

export const SectionSchema = v.object({
  boardId: v.string(),
  id: v.string(),
  name: v.string(),
  orientation: v.union([v.literal("horizontal"), v.literal("vertical")]),
  size: v.number(),
});

export const BoardSchema = v.object({
  description: v.string(),
  id: v.string(),
  sectionXOrder: v.array(v.string()),
  sectionYOrder: v.array(v.string()),
  title: v.string(),
  user: v.string(),
});

export type TaskModel = v.InferOutput<typeof TaskSchema>;
export type EdgeModel = v.InferOutput<typeof EdgeSchema>;
export type BoardModel = v.InferOutput<typeof BoardSchema>;
export type SectionModel = v.InferOutput<typeof SectionSchema>;

import * as v from "valibot";

export const TaskSchema = v.object({
  axisX: v.string(),
  axisY: v.string(),
  boardId: v.string(),
  description: v.string(),
  estimate: v.number(),
  id: v.string(),
  link: v.optional(v.string()),
  positionX: v.number(),
  positionY: v.number(),
  title: v.string(),
});

export const EdgeSchema = v.object({
  boardId: v.string(),
  breakX: v.number(),
  id: v.string(),
  source: v.string(),
  target: v.string(),
});

export const AxisSchema = v.object({
  boardId: v.string(),
  id: v.string(),
  name: v.string(),
  orientation: v.union([v.literal("horizontal"), v.literal("vertical")]),
  size: v.number(),
});

export const BoardSchema = v.object({
  description: v.string(),
  id: v.string(),
  title: v.string(),
  user: v.string(),
});

export type TaskModel = v.InferOutput<typeof TaskSchema>;
export type EdgeModel = v.InferOutput<typeof EdgeSchema>;
export type AxisModel = v.InferOutput<typeof AxisSchema>;
export type BoardModel = v.InferOutput<typeof BoardSchema>;

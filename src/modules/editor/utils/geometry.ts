import type { Point2D } from "./types";

export const subtractPoint = (point: Point2D, other: Point2D) => {
  return { x: point.x - other.x, y: point.y - other.y };
};

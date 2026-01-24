import * as d3 from "d3";
import {
  type Component,
  type ParentProps,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { SVG_SELECTOR } from "../utils/constants";
import type { Point2D } from "../utils/types";

export type Transform = {
  k: number;
  x: number;
  y: number;
};

const SCALE_BY = 1.1;
const WIDTH = 500;
const HEIGHT = 500;

const createBoardTransformContext = () => {
  const [transform, setTransform] = createSignal<Transform>({ k: 1, x: 0, y: 0 });

  // oxlint-disable-next-line no-explicit-any
  const selection = () => d3.select(SVG_SELECTOR) as any;

  const onZoomed = (event: { transform: Transform }) => {
    setTransform(event.transform);
  };

  const plugin = d3
    .zoom()
    .extent([
      [0, 0],
      [WIDTH, HEIGHT],
    ])
    .scaleExtent([0.2, 8])
    .on("zoom", onZoomed);

  const reset = () => {
    setTransform({
      k: 1,
      x: 0,
      y: 0,
    });
  };

  const zoomIn = (point: Point2D) => {
    const state = transform();
    plugin.scaleTo(selection(), state.k * SCALE_BY, [point.x, point.y]);
  };

  const zoomOut = (point: Point2D) => {
    const state = transform();
    plugin.scaleTo(selection(), state.k / SCALE_BY, [point.x, point.y]);
  };

  createEffect(() => {
    // oxlint-disable-next-line no-explicit-any
    d3.select(SVG_SELECTOR).call(plugin as any);

    onCleanup(() => {
      d3.select(SVG_SELECTOR).on(".zoom", null);
    });
  });

  return [transform, { reset, zoomIn, zoomOut }] as const;
};

export const translateX = (transform: Transform, x: number) => {
  return x * transform.k + transform.x;
};

export const translateY = (transform: Transform, y: number) => {
  return y * transform.k + transform.y;
};

const BoardTransformContext = createContext<ReturnType<typeof createBoardTransformContext> | null>(
  null,
);

export const BoardTransformProvider: Component<ParentProps> = (props) => {
  const value = createBoardTransformContext();

  return (
    <BoardTransformContext.Provider value={value}>{props.children}</BoardTransformContext.Provider>
  );
};

export const useBoardTransformContext = () => {
  const context = useContext(BoardTransformContext);

  if (!context) {
    throw new Error("BoardTransformContext is not defined");
  }

  return context;
};

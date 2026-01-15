import * as d3 from "d3";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import type { Point2D } from "~/modules/editor/utils/types";
import { SVG_SELECTOR } from "../utils/constants";
import { useToolsStateContext } from "./tools-state";

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

  const translateX = (x: number) => {
    const transformValue = transform();
    return x * transformValue.k + transformValue.x;
  };

  const translateY = (y: number) => {
    const transformValue = transform();
    return y * transformValue.k + transformValue.y;
  };

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

  return {
    plugin,
    reset,
    transform,
    translateX,
    translateY,
    zoomIn,
    zoomOut,
  };
};

const BoardTransformContext = createContext<
  Accessor<ReturnType<typeof createBoardTransformContext>>
>(() => {
  throw new Error("BoardTransformContext is not defined");
});

export const BoardTransformProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createBoardTransformContext());

  const toolsState = useToolsStateContext();

  createEffect(() => {
    const isPane = toolsState().tool() === "pane";

    if (!isPane) {
      return;
    }

    // oxlint-disable-next-line no-explicit-any
    d3.select(SVG_SELECTOR).call(value().plugin as any);
    onCleanup(() => {
      d3.select(SVG_SELECTOR).on(".zoom", null);
    });
  });

  return (
    <BoardTransformContext.Provider value={value}>{props.children}</BoardTransformContext.Provider>
  );
};

export const useBoardTransformContext = () => {
  return useContext(BoardTransformContext);
};

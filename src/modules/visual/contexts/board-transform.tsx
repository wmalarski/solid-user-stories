import * as d3 from "d3";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import type { Point2D } from "~/modules/editor/utils/types";

export type Transform = {
  k: number;
  x: number;
  y: number;
};

const SCALE_BY = 1.1;
const WIDTH = 500;
const HEIGHT = 500;

const getNewZoomState = (newScale: number, point: Point2D, old: Transform): Transform => {
  const { k: stageScale, x: stageX, y: stageY } = old;
  const mouseX = point.x / stageScale - stageX / stageScale;
  const mouseY = point.y / stageScale - stageY / stageScale;
  const newStageX = -(mouseX - point.x / newScale) * newScale;
  const newStageY = -(mouseY - point.y / newScale) * newScale;
  return { ...old, k: newScale, x: newStageX, y: newStageY };
};

const createBoardTransformContext = () => {
  const [transform, setTransform] = createSignal<Transform>({ k: 1, x: 0, y: 0 });

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
    setTransform(getNewZoomState(state.k * SCALE_BY, point, state));
  };

  const zoomOut = (point: Point2D) => {
    const state = transform();
    setTransform(getNewZoomState(state.k / SCALE_BY, point, state));
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

  return (
    <BoardTransformContext.Provider value={value}>{props.children}</BoardTransformContext.Provider>
  );
};

export const useBoardTransformContext = () => {
  return useContext(BoardTransformContext);
};

type UseZoomTransformArgs = {
  ref: Accessor<SVGElement | undefined>;
};

export const useZoomTransform = (args: UseZoomTransformArgs) => {
  const boardTransform = useBoardTransformContext();

  createEffect(() => {
    const refValue = args.ref();

    if (refValue) {
      // oxlint-disable-next-line no-explicit-any
      d3.select(refValue).call(boardTransform().plugin as any);
    }
  });
};

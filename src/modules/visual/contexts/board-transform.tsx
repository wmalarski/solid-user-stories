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

export type Transform = {
  k: number;
  x: number;
  y: number;
};

const createBoardTransformContext = () => {
  const [transform, setTransform] = createSignal<Transform>({ k: 1, x: 0, y: 0 });

  const translateX = (x: number) => {
    const transformValue = transform();
    return x * transformValue.k + transformValue.x;
  };

  const translateY = (y: number) => {
    const transformValue = transform();
    return y * transformValue.k + transformValue.y;
  };

  return { height: 500, setTransform, transform, translateX, translateY, width: 500 };
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

  const onZoomed = (event: { transform: Transform }) => {
    boardTransform().setTransform(event.transform);
  };

  const width = createMemo(() => boardTransform().width);
  const height = createMemo(() => boardTransform().height);

  createEffect(() => {
    const refValue = args.ref();

    if (!refValue) {
      return;
    }

    const plugin = d3
      .zoom()
      .extent([
        [0, 0],
        [width(), height()],
      ])
      .scaleExtent([0.2, 8])
      .on("zoom", onZoomed);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);
  });
};

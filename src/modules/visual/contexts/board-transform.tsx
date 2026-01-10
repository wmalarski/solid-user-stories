import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

const createBoardTransformContext = () => {
  const [transform, setTransform] = createSignal<string>();

  return { height: 500, setTransform, transform, width: 500 };
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

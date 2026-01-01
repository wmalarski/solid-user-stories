import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

export type TaskHandleType = "left" | "right";

type SourceState = {
  taskId: string;
  handle: TaskHandleType;
};

const createEdgeDrawingContext = () => {
  const [source, setSource] = createSignal<SourceState | null>(null);
  return { setSource, source };
};

const EdgeDrawingStateContext = createContext<
  Accessor<ReturnType<typeof createEdgeDrawingContext>>
>(() => {
  throw new Error("EdgeDrawingStateContext not defined");
});

export const useEdgeDrawingContext = () => {
  return useContext(EdgeDrawingStateContext);
};

export const EdgeDrawingStateContextProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createEdgeDrawingContext());

  return (
    <EdgeDrawingStateContext.Provider value={value}>
      {props.children}
    </EdgeDrawingStateContext.Provider>
  );
};

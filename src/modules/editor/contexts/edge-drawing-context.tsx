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

export type DrawingState = {
  taskId: string;
  handle: TaskHandleType;
  positionX: number;
  positionY: number;
};

const createEdgeDrawingContext = () => {
  const [source, setSource] = createSignal<DrawingState | null>(null);
  return { setSource, source };
};

const EdgeDrawingContext = createContext<Accessor<ReturnType<typeof createEdgeDrawingContext>>>(
  () => {
    throw new Error("EdgeDrawingContext not defined");
  },
);

export const useEdgeDrawingContext = () => {
  return useContext(EdgeDrawingContext);
};

export const EdgeDrawingContextProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createEdgeDrawingContext());

  return <EdgeDrawingContext.Provider value={value}>{props.children}</EdgeDrawingContext.Provider>;
};

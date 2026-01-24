import {
  createContext,
  createSignal,
  useContext,
  type Component,
  type ParentProps,
} from "solid-js";

const createDragStateContext = () => {
  const [isDragging, setIsDragging] = createSignal(false);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return [isDragging, { onDragEnd, onDragStart }] as const;
};

const DragStateContext = createContext<ReturnType<typeof createDragStateContext> | null>(null);

export const useDragStateContext = () => {
  const context = useContext(DragStateContext);
  if (!context) {
    throw new Error("DragContext not defined");
  }
  return context;
};

export const DragStateProvider: Component<ParentProps> = (props) => {
  const value = createDragStateContext();

  return <DragStateContext.Provider value={value}>{props.children}</DragStateContext.Provider>;
};

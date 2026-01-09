import {
  createContext,
  createMemo,
  createSignal,
  useContext,
  type Accessor,
  type Component,
  type ComponentProps,
} from "solid-js";

const createDragContext = () => {
  const [isDragging, setIsDragging] = createSignal(false);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return { isDragging, onDragEnd, onDragStart };
};

const DragContext = createContext<Accessor<ReturnType<typeof createDragContext>>>(() => {
  throw new Error("DragContext not defined");
});

export const useDragContext = () => {
  return useContext(DragContext);
};

export const DragGroup: Component<ComponentProps<"g">> = (props) => {
  const value = createMemo(() => createDragContext());

  return (
    <g cursor={value().isDragging() ? "grabbing" : "grab"} {...props}>
      <DragContext.Provider value={value}>{props.children}</DragContext.Provider>
    </g>
  );
};

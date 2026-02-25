import {
  createContext,
  createSignal,
  useContext,
  type Component,
  type ParentProps,
} from "solid-js";
import type { Point2D } from "../utils/types";

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
    throw new Error("DragStateContext not defined");
  }
  return context;
};

const createSnapPositionContext = () => {
  const [snapPosition, setSnapPosition] = createSignal<Point2D | null>(null);

  const onSnapPositionChange = (position: Point2D | null) => {
    setSnapPosition(position);
  };

  return [snapPosition, { onSnapPositionChange }] as const;
};

const SnapPositionContext = createContext<ReturnType<typeof createSnapPositionContext> | null>(
  null,
);

export const useSnapPositionContext = () => {
  const context = useContext(SnapPositionContext);
  if (!context) {
    throw new Error("SnapPositionContext not defined");
  }
  return context;
};

export const DragStateProvider: Component<ParentProps> = (props) => {
  const value = createDragStateContext();
  const snapValue = createSnapPositionContext();

  return (
    <DragStateContext.Provider value={value}>
      <SnapPositionContext.Provider value={snapValue}>
        {props.children}
      </SnapPositionContext.Provider>
    </DragStateContext.Provider>
  );
};

import { type Component, type ParentProps, createContext, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { Point2D } from "../utils/types";

type EdgeDragState = {
  hasPosition: boolean;
  isDragging: boolean;
  cursor: Point2D;
  start: Point2D;
};

const createEdgeDragStateContext = () => {
  const [state, setStore] = createStore<EdgeDragState>({
    cursor: { x: 0, y: 0 },
    hasPosition: false,
    isDragging: false,
    start: { x: 0, y: 0 },
  });

  const onDragEnd = () => {
    setStore(
      produce((draft) => {
        draft.hasPosition = false;
        draft.isDragging = false;
      }),
    );
  };

  const onDragStart = (start: Point2D) => {
    setStore(
      produce((draft) => {
        draft.isDragging = true;
        draft.start = start;
      }),
    );
  };

  const onDrag = (point: Point2D) => {
    setStore(
      produce((draft) => {
        draft.cursor = point;
        draft.hasPosition = true;
      }),
    );
  };

  return [state, { onDrag, onDragEnd, onDragStart }] as const;
};

const EdgeDragStateContext = createContext<ReturnType<typeof createEdgeDragStateContext> | null>(
  null,
);

export const EdgeDragStateProvider: Component<ParentProps> = (props) => {
  const value = createEdgeDragStateContext();

  return (
    <EdgeDragStateContext.Provider value={value}>{props.children}</EdgeDragStateContext.Provider>
  );
};

export const useEdgeDragStateContext = () => {
  const value = useContext(EdgeDragStateContext);

  if (!value) {
    throw new Error("EdgeDragStateProvider is not defined");
  }

  return value;
};

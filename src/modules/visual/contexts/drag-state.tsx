import * as d3 from "d3";
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { useToolsStateContext } from "./tools-state";

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

type CreateDragArgs = {
  ref: Accessor<SVGElement | undefined>;
  onDragStarted?: (event: DragEvent) => void;
  onDragged: (event: DragEvent) => void;
  onDragEnded?: (event: DragEvent) => void;
};

export const useDrag = (args: CreateDragArgs) => {
  const [_isDragging, { onDragEnd, onDragStart }] = useDragStateContext();
  const [toolsState] = useToolsStateContext();

  const onDragStarted = (event: DragEvent) => {
    onDragStart();
    args.onDragStarted?.(event);
  };

  const onDragged = (event: DragEvent) => {
    args.onDragged(event);
  };

  const onDragEnded = (event: DragEvent) => {
    onDragEnd();
    args.onDragEnded?.(event);
  };

  createEffect(() => {
    const refValue = args.ref();
    const toolsStateValue = toolsState();

    if (!refValue || toolsStateValue !== "pane") {
      return;
    }

    const plugin = d3
      .drag()
      .on("start", onDragStarted)
      .on("drag", onDragged)
      .on("end", onDragEnded);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);

    onCleanup(() => {
      d3.select(refValue).on(".start .drag .end", null);
    });
  });
};

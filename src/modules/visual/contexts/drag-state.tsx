import * as d3 from "d3";
import {
  createContext,
  createEffect,
  createMemo,
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

  return { isDragging, onDragEnd, onDragStart };
};

const DragStateContext = createContext<Accessor<ReturnType<typeof createDragStateContext>>>(() => {
  throw new Error("DragContext not defined");
});

export const useDragStateContext = () => {
  return useContext(DragStateContext);
};

export const DragStateProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createDragStateContext());

  return <DragStateContext.Provider value={value}>{props.children}</DragStateContext.Provider>;
};

type CreateDragArgs = {
  ref: Accessor<SVGElement | undefined>;
  onDragStarted?: (event: DragEvent) => void;
  onDragged: (event: DragEvent) => void;
  onDragEnded?: (event: DragEvent) => void;
};

export const useDrag = (args: CreateDragArgs) => {
  const dragContext = useDragStateContext();
  const [toolsState] = useToolsStateContext();

  const onDragStarted = (event: DragEvent) => {
    dragContext().onDragStart();
    args.onDragStarted?.(event);
  };

  const onDragged = (event: DragEvent) => {
    args.onDragged(event);
  };

  const onDragEnded = (event: DragEvent) => {
    dragContext().onDragEnd();
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

import { createSignal, type Component } from "solid-js";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { useZoomTransform } from "../utils/use-zoom-transform";
import { DragGroup } from "./drag-group";
import { TaskGroup } from "./task-group";

export const VisualPanel: Component = () => {
  return (
    <BoardThemeProvider>
      <BoardTransformProvider>
        <DragAndDropExample />
      </BoardTransformProvider>
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();
  const boardTransformContext = useBoardTransformContext();

  useZoomTransform({ ref: svgRef });

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <DragGroup transform={boardTransformContext().transform()}>
        <TaskGroup index={240} x={123} y={456} />
      </DragGroup>
    </svg>
  );
};

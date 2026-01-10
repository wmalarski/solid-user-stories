import { createSignal, type Component } from "solid-js";
import { BoardThemeProvider } from "../contexts/board-theme";
import { createZoom } from "../utils/create-zoom";
import { DragGroup } from "./drag-group";
import { TaskGroup } from "./task-group";

export const VisualPanel: Component = () => {
  return (
    <BoardThemeProvider>
      <DragAndDropExample />
    </BoardThemeProvider>
  );
};

const DragAndDropExample: Component = () => {
  const height = 500;
  const width = 500;

  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();
  const [transform, setTransform] = createSignal<string>();

  createZoom({
    height: () => height,
    onZoomed: setTransform,
    ref: svgRef,
    width: () => width,
  });

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <DragGroup transform={transform()}>
        <TaskGroup index={240} x={123} y={456} />
      </DragGroup>
    </svg>
  );
};

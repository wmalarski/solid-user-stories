import { createSignal, type Component } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AxisConfigProvider } from "../contexts/axis-config";
import { BoardModelProvider } from "../contexts/board-model";
import { BoardThemeProvider } from "../contexts/board-theme";
import { BoardTransformProvider, useBoardTransformContext } from "../contexts/board-transform";
import { useZoomTransform } from "../utils/use-zoom-transform";
import { DragGroup } from "./drag-group";
import { TaskGroup } from "./task-group";

type VisualPanelProps = {
  board: BoardModel;
};

export const VisualPanel: Component<VisualPanelProps> = (props) => {
  return (
    <BoardThemeProvider>
      <BoardTransformProvider>
        <BoardModelProvider board={props.board}>
          <AxisConfigProvider>
            <DragAndDropExample />
          </AxisConfigProvider>
        </BoardModelProvider>
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

import * as d3 from "d3";
import { createMemo, type Component } from "solid-js";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useIsEdgeSelected } from "../contexts/selection-state";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "../utils/constants";

type EdgePathProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

export const EdgePath: Component<EdgePathProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const isSelected = useIsEdgeSelected(() => props.edge.id);

  const path = createMemo(() => {
    const startX = props.source.positionX + TASK_RECT_WIDTH;
    const endX = props.target.positionX;

    const heightOffset = TASK_RECT_HEIGHT / 2;
    const startY = props.source.positionY + heightOffset;
    const endY = props.target.positionY + heightOffset;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(props.edge.breakX, startY);
    context.lineTo(props.edge.breakX, endY);
    context.lineTo(endX, endY);
    return context.toString();
  });

  return (
    <path
      d={path()}
      stroke-width={isSelected() ? 2 : 1}
      stroke={isSelected() ? boardTheme().selectionColor : boardTheme().edgeColor}
      fill="transparent"
    />
  );
};

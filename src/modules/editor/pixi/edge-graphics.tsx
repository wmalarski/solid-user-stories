import { Graphics, type FederatedMouseEvent, type FederatedPointerEvent } from "pixi.js";
import { createEffect, Show, type Component } from "solid-js";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useEdgeDrawingContext, type DrawingState } from "../contexts/edge-drawing-context";
import { useIsSelected, useSelectionContext } from "../contexts/selection-context";
import { useTransformPoint } from "../contexts/transform-state";
import { RIGHT_BUTTON, TASK_GRPAHICS_HEIGHT, TASK_GRPAHICS_WIDTH } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiContainer } from "./pixi-app";
import { createMountAsChild } from "./utils/create-mount-as-child";
import { createPointerListeners } from "./utils/create-pointer-listeners";

export const DrawingEdgeGraphics: Component = () => {
  const edgeDrawing = useEdgeDrawingContext();

  return (
    <Show when={edgeDrawing().source()}>
      {(source) => <DrawingEdgeGraphicsContent source={source()} />}
    </Show>
  );
};

type DrawingEdgeGraphicsContentProps = {
  source: DrawingState;
};

const DrawingEdgeGraphicsContent: Component<DrawingEdgeGraphicsContentProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const transformPoint = useTransformPoint();

  const edgeDrawing = useEdgeDrawingContext();

  const graphics = new Graphics({ eventMode: "none" });
  createMountAsChild(container, graphics);

  createPointerListeners(container, {
    onPointerMove: (event: FederatedPointerEvent) => {
      const eventPosition = transformPoint(event);

      graphics.clear();
      graphics
        .moveTo(props.source.positionX, props.source.positionY)
        .lineTo(eventPosition.x, eventPosition.y)
        .stroke({ color: theme().edgeDrawingColor });
    },
    onPointerUp: () => {
      edgeDrawing().setSource(null);
    },
  });

  return null;
};

type EdgeGraphicsProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

export const EdgeGraphics: Component<EdgeGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const selection = useSelectionContext();
  const isSelected = useIsSelected(() => props.edge.id);

  const graphics = new Graphics();
  createMountAsChild(container, graphics);

  createEffect(() => {
    const isSelectedValue = isSelected();
    const themeValue = theme();
    const heightOffset = TASK_GRPAHICS_HEIGHT / 2;

    graphics.clear();
    graphics
      .moveTo(props.source.positionX + TASK_GRPAHICS_WIDTH, props.source.positionY + heightOffset)
      .lineTo(props.target.positionX, props.target.positionY + heightOffset)
      .stroke({ color: isSelectedValue ? themeValue.selectionColor : themeValue.edgeColor });
  });

  createPointerListeners(graphics, {
    onPointerDown: (event: FederatedMouseEvent) => {
      if (event.button === RIGHT_BUTTON) {
        return;
      }

      selection().setSelection([props.edge.id]);
    },
  });

  return null;
};

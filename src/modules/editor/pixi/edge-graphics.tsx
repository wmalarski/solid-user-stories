import { Graphics, type FederatedPointerEvent } from "pixi.js";
import { createEffect, onCleanup, onMount, Show, type Component } from "solid-js";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useEdgeDrawingContext, type DrawingState } from "../contexts/edge-drawing-context";
import { useTransformPoint } from "../contexts/transform-state";
import { TASK_GRPAHICS_HEIGHT, TASK_GRPAHICS_WIDTH } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiContainer } from "./pixi-app";

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

  const graphics = new Graphics({
    eventMode: "none",
  });
  const onPointerMove = (event: FederatedPointerEvent) => {
    const eventPosition = transformPoint(event);

    graphics.clear();
    graphics
      .moveTo(props.source.positionX, props.source.positionY)
      .lineTo(eventPosition.x, eventPosition.y)
      .stroke({ color: theme().edgeDrawingColor });
  };

  const onPointerUp = (_event: FederatedPointerEvent) => {
    edgeDrawing().setSource(null);
  };

  onMount(() => {
    container.on("pointerup", onPointerUp);
    container.on("pointermove", onPointerMove);
    container.addChild(graphics);
  });

  onCleanup(() => {
    container.off("pointerup", onPointerUp);
    container.off("pointermove", onPointerMove);
    container.removeChild(graphics);
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

  const graphics = new Graphics();

  createEffect(() => {
    const heightOffset = TASK_GRPAHICS_HEIGHT / 2;

    graphics.clear();
    graphics
      .moveTo(props.source.positionX + TASK_GRPAHICS_WIDTH, props.source.positionY + heightOffset)
      .lineTo(props.target.positionX, props.target.positionY + heightOffset)
      .stroke({ color: theme().edgeColor });
  });

  onMount(() => {
    container.addChild(graphics);
  });

  onCleanup(() => {
    container.removeChild(graphics);
  });

  return null;
};

import { Graphics, type FederatedPointerEvent } from "pixi.js";
import { onCleanup, onMount, Show, type Component } from "solid-js";
import { useEdgeDrawingContext, type SourceState } from "../contexts/edge-drawing-context";
import { useTransformPoint } from "../contexts/transform-state";
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
  source: SourceState;
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

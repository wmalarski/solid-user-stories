import { eq, useLiveQuery } from "@tanstack/solid-db";
import { Graphics, type FederatedMouseEvent, type FederatedPointerEvent } from "pixi.js";
import { createEffect, Show, type Component } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useEdgeDrawingContext, type DrawingState } from "../contexts/edge-drawing-context";
import { useIsSelected, useSelectionContext } from "../contexts/selection-context";
import { useTransformPoint } from "../contexts/transform-state";
import { RIGHT_BUTTON, TASK_GRPAHICS_HEIGHT, TASK_GRPAHICS_WIDTH } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { useTaskContainer } from "./pixi-app";
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

  const container = useTaskContainer();

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

type EdgeContainerProps = {
  edgeId: string;
};

export const EdgeContainer: Component<EdgeContainerProps> = (props) => {
  const collection = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.id, props.edgeId))
      .innerJoin({ source: taskCollection }, ({ edge, source }) => eq(edge.source, source.id))
      .innerJoin({ target: taskCollection }, ({ edge, target }) => eq(edge.target, target.id))
      .findOne(),
  );

  return (
    <Show when={collection.data.at(0)}>
      {(value) => (
        <EdgeGraphics edge={value().edge} source={value().source} target={value().target} />
      )}
    </Show>
  );
};

type EdgeGraphicsProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

export const EdgeGraphics: Component<EdgeGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = useTaskContainer();

  const selection = useSelectionContext();
  const isSelected = useIsSelected(() => props.edge.id);

  const graphics = new Graphics();
  createMountAsChild(container, graphics);

  createEffect(() => {
    const isSelectedValue = isSelected();
    const themeValue = theme();

    const startX = props.source.positionX + TASK_GRPAHICS_WIDTH;
    const endX = props.target.positionX;

    const heightOffset = TASK_GRPAHICS_HEIGHT / 2;
    const startY = props.source.positionY + heightOffset;
    const endY = props.target.positionY + heightOffset;

    graphics.clear();
    graphics
      .moveTo(startX, startY)
      .lineTo(props.edge.breakX, startY)
      .lineTo(props.edge.breakX, endY)
      .lineTo(endX, endY)
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

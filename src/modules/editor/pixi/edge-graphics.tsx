import { eq, useLiveQuery } from "@tanstack/solid-db";
import { Graphics, type FederatedMouseEvent, type FederatedPointerEvent } from "pixi.js";
import { createEffect, createMemo, onCleanup, Show, type Component } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { useEdgeDrawingContext, type DrawingState } from "../contexts/edge-drawing-context";
import { useIsSelected, useSelectionContext } from "../contexts/selection-context";
import {
  KEY_BACKSPACE,
  KEY_DELETE,
  RIGHT_BUTTON,
  TASK_GRAPHICS_HEIGHT,
  TASK_GRAPHICS_HEIGHT_2,
  TASK_GRAPHICS_WIDTH,
} from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { useTaskContainer } from "./pixi-app";
import { createMountAsChild } from "./utils/create-mount-as-child";
import { createObjectDrag } from "./utils/create-object-drag";
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

  // const transformPoint = useTransformPoint();

  const edgeDrawing = useEdgeDrawingContext();

  const graphics = new Graphics({ eventMode: "none" });
  createMountAsChild(container, graphics);

  createPointerListeners(container, {
    onPointerMove: (event: FederatedPointerEvent) => {
      graphics.clear();
      graphics
        .moveTo(props.source.positionX, props.source.positionY)
        .lineTo(event.x, event.y)
        .stroke({ color: theme().edgeDrawingColor });
    },
    onPointerUp: () => {
      edgeDrawing().setSource(null);
    },
  });

  // createEffect(() => {
  //   graphics.x = props.source.positionX;
  //   graphics.y = props.source.positionY;
  // });

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

const EdgeGraphics: Component<EdgeGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = useTaskContainer();

  const selection = useSelectionContext();
  const isSelected = useIsSelected(() => props.edge.id);

  const graphics = new Graphics();
  createMountAsChild(container, graphics);

  createEffect(() => {
    const isSelectedValue = isSelected();
    const themeValue = theme();

    const startX = props.source.positionX + TASK_GRAPHICS_WIDTH;
    const endX = props.target.positionX;

    const heightOffset = TASK_GRAPHICS_HEIGHT / 2;
    const startY = props.source.positionY + heightOffset;
    const endY = props.target.positionY + heightOffset;

    graphics.clear();
    graphics
      .moveTo(startX, startY)
      .lineTo(props.edge.breakX, startY)
      .lineTo(props.edge.breakX, endY)
      .lineTo(endX, endY)
      .stroke({
        color: isSelectedValue ? themeValue.selectionColor : themeValue.edgeColor,
        width: 2,
      });
  });

  createPointerListeners(graphics, {
    onPointerDown: (event: FederatedMouseEvent) => {
      if (event.button === RIGHT_BUTTON) {
        return;
      }

      selection().setSelection([props.edge.id]);
    },
  });

  createEffect(() => {
    const isSelectedValue = isSelected();

    if (!isSelectedValue) {
      return;
    }

    const abortController = new AbortController();

    globalThis.addEventListener(
      "keyup",
      (event) => {
        if (event.key === KEY_BACKSPACE || event.key === KEY_DELETE) {
          edgeCollection.delete(props.edge.id);
        }
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return (
    <Show when={isSelected()}>
      <EdgeHandleGraphics edge={props.edge} source={props.source} target={props.target} />
    </Show>
  );
};

const HANDLE_WIDTH = 16;
const HANDLE_WIDTH_2 = HANDLE_WIDTH / 2;

type EdgeHandleGraphicsProps = {
  edge: EdgeModel;
  source: TaskModel;
  target: TaskModel;
};

const EdgeHandleGraphics: Component<EdgeHandleGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = useTaskContainer();

  const isSelected = useIsSelected(() => props.edge.id);

  const graphics = new Graphics();
  createMountAsChild(container, graphics);

  createEffect(() => {
    const isSelectedValue = isSelected();
    const themeValue = theme();

    graphics.clear();
    graphics.rect(-HANDLE_WIDTH_2, -HANDLE_WIDTH_2, HANDLE_WIDTH, HANDLE_WIDTH).fill({
      color: isSelectedValue ? themeValue.selectionColor : themeValue.edgeColor,
    });
  });

  createEffect(() => {
    graphics.x = props.edge.breakX;
  });

  const breakY = createMemo(() => {
    const breakY = (props.source.positionY + props.target.positionY) / 2;
    return breakY + TASK_GRAPHICS_HEIGHT_2;
  });

  createEffect(() => {
    graphics.y = breakY();
  });

  createObjectDrag(graphics, {
    dragConstraint: (args) => {
      return { x: args.eventPosition.x - args.shift.x, y: breakY() };
    },
    onDragMove: () => {
      edgeCollection.update(props.edge.id, (draft) => {
        draft.breakX = graphics.x;
      });
    },
  });

  return null;
};

import type { FederatedMouseEvent } from "pixi.js";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, onCleanup, onMount, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import type { TaskHandleType } from "../contexts/edge-drawing-context";
import { useEdgeDrawingContext } from "../contexts/edge-drawing-context";
import { RIGHT_BUTTON } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiContainer } from "./pixi-app";
import { useDragObject } from "./use-drag-object";

const TASK_GRPAHICS_WIDTH = 200;
const TASK_GRPAHICS_HEIGHT = 100;
const TASK_TEXT_FONT_SIZE = 16;
const TASK_HANDLE_SIZE = 10;

type TaskGraphicsProps = {
  task: TaskModel;
};

export const TaskGraphics: Component<TaskGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const taskContainer = new Container();
  const graphics = new Graphics();

  const style = new TextStyle({ fontSize: TASK_TEXT_FONT_SIZE });
  const title = new Text({ style });

  createEffect(() => {
    graphics.clear();
    graphics
      .rect(0, 0, TASK_GRPAHICS_WIDTH, TASK_GRPAHICS_HEIGHT)
      .fill({ color: theme().taskBackgroundColor });
  });

  createEffect(() => {
    taskContainer.x = props.task.positionX;
    taskContainer.y = props.task.positionY;
  });

  createEffect(() => {
    title.text = `${props.task.title}\n${props.task.description}\n${props.task.estimate}`;
  });

  onMount(() => {
    taskContainer.addChild(graphics);
    taskContainer.addChild(title);
    container.addChild(taskContainer);
  });

  onCleanup(() => {
    taskContainer.removeChild(graphics);
    taskContainer.removeChild(title);
    container.removeChild(taskContainer);
    graphics.destroy();
  });

  useDragObject({
    displayObject: taskContainer,
    onDragEnd: () => {
      taskCollection.update(props.task.id, (draft) => {
        draft.positionX = taskContainer.x;
        draft.positionY = taskContainer.y;
      });
    },
  });

  return (
    <>
      <TaskHandle task={props.task} handle="left" taskContainer={taskContainer} />
      <TaskHandle task={props.task} handle="right" taskContainer={taskContainer} />
    </>
  );
};

type TaskHandleProps = {
  taskContainer: Container;
  task: TaskModel;
  handle: TaskHandleType;
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
  const theme = useBoardTheme();

  const edgeDrawing = useEdgeDrawingContext();

  const graphics = new Graphics();

  createEffect(() => {
    const handleOffset = TASK_HANDLE_SIZE / 2;
    const positionX = props.handle === "left" ? 0 : TASK_GRPAHICS_WIDTH;

    graphics.clear();
    graphics
      .rect(
        positionX - handleOffset,
        TASK_GRPAHICS_HEIGHT / 2 - handleOffset,
        TASK_HANDLE_SIZE,
        TASK_HANDLE_SIZE,
      )
      .fill({ color: theme().taskHandleBackgroundColor });
  });

  onMount(() => {
    props.taskContainer.addChild(graphics);
  });

  onCleanup(() => {
    props.taskContainer.removeChild(graphics);
  });

  const onPointerUp = (event: FederatedMouseEvent) => {
    // const parent = args.displayObject.parent;

    if (event.button === RIGHT_BUTTON) {
      return;
    }

    event.stopPropagation();

    const edgeDrawingValue = edgeDrawing();

    const source = edgeDrawingValue.source();

    console.log("[onPointerUp]", props.task, source);

    edgeDrawingValue.setSource(null);

    // const transform = parent.worldTransform;
    // const inverted = transform.applyInverse(event.global);

    // setShift(subtractPoint(inverted, args.displayObject));

    // parent.on("pointermove", onDragMove);
    // parent.once("pointerup", onDragEnd);
    // parent.once("pointerupoutside", onDragEnd);

    // args.onDragStart?.(event);

    // app.canvas.style.cursor = "grab";
  };

  const onPointerDown = (event: FederatedMouseEvent) => {
    // const parent = args.displayObject.parent;

    if (event.button === RIGHT_BUTTON) {
      return;
    }

    event.stopPropagation();

    const edgeDrawingValue = edgeDrawing();

    edgeDrawingValue.setSource(
      (source) => source ?? { handle: props.handle, taskId: props.task.id },
    );

    console.log("[onPointerDown]", props.task);

    // const transform = parent.worldTransform;
    // const inverted = transform.applyInverse(event.global);

    // setShift(subtractPoint(inverted, args.displayObject));

    // parent.on("pointermove", onDragMove);
    // parent.once("pointerup", onDragEnd);
    // parent.once("pointerupoutside", onDragEnd);

    // args.onDragStart?.(event);

    // app.canvas.style.cursor = "grab";
  };

  onMount(() => {
    graphics.on("pointerdown", onPointerDown);
    graphics.on("pointerup", onPointerUp);
  });

  onCleanup(() => {
    graphics.off("pointerdown", onPointerDown);
    graphics.off("pointerup", onPointerUp);
  });

  return null;
};

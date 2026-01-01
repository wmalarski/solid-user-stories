import { type FederatedMouseEvent, Container, Graphics, Text, TextStyle } from "pixi.js";
import { type Component, createEffect, createMemo, onCleanup, onMount, Show } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { useBoardId } from "../contexts/board-context";
import {
  type SourceState,
  type TaskHandleType,
  useEdgeDrawingContext,
} from "../contexts/edge-drawing-context";
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

  const edgeDrawing = useEdgeDrawingContext();

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
    taskContainer.label = `CONTAINER:${props.task}`;
    graphics.label = `GRAPHICS:${props.task}`;
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
      <Show when={edgeDrawing().source()}>
        {(source) => (
          <EdgeDrawingListener source={source()} task={props.task} taskContainer={taskContainer} />
        )}
      </Show>
    </>
  );
};

type EdgeDrawingListenerProps = {
  taskContainer: Container;
  task: TaskModel;
  source: SourceState;
};

const EdgeDrawingListener: Component<EdgeDrawingListenerProps> = (props) => {
  const boardId = useBoardId();

  const onPointerUp = (event: FederatedMouseEvent) => {
    if (event.button === RIGHT_BUTTON) {
      return;
    }

    edgeCollection.insert({
      boardId: boardId(),
      breakX: (props.source.positionX + event.x) / 2,
      id: createId(),
      source: props.source.taskId,
      target: props.task.id,
    });
  };

  onMount(() => {
    props.taskContainer.on("pointerup", onPointerUp);
  });

  onCleanup(() => {
    props.taskContainer.off("pointerup", onPointerUp);
  });

  return null;
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

  const localPosition = createMemo(() => {
    const handleX = props.handle === "left" ? 0 : TASK_GRPAHICS_WIDTH;
    return {
      positionX: handleX,
      positionY: TASK_GRPAHICS_HEIGHT / 2,
    };
  });

  createEffect(() => {
    const handleOffset = TASK_HANDLE_SIZE / 2;
    const { positionX, positionY } = localPosition();

    graphics.clear();
    graphics
      .rect(positionX - handleOffset, positionY - handleOffset, TASK_HANDLE_SIZE, TASK_HANDLE_SIZE)
      .fill({ color: theme().taskHandleBackgroundColor });
  });

  onMount(() => {
    props.taskContainer.addChild(graphics);
  });

  onCleanup(() => {
    props.taskContainer.removeChild(graphics);
  });

  const onPointerDown = (event: FederatedMouseEvent) => {
    if (event.button === RIGHT_BUTTON) {
      return;
    }

    event.stopPropagation();

    const edgeDrawingValue = edgeDrawing();
    const { positionX, positionY } = localPosition();

    edgeDrawingValue.setSource(
      (source) =>
        source ?? {
          handle: props.handle,
          positionX: props.task.positionX + positionX,
          positionY: props.task.positionY + positionY,
          taskId: props.task.id,
        },
    );
  };

  onMount(() => {
    graphics.on("pointerdown", onPointerDown);
  });

  onCleanup(() => {
    graphics.off("pointerdown", onPointerDown);
  });

  return null;
};

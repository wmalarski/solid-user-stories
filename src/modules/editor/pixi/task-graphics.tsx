import { type FederatedMouseEvent, Container, Graphics, Text, TextStyle } from "pixi.js";
import { type Component, createEffect, createMemo, Show } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { useBoardId } from "../contexts/board-context";
import {
  type DrawingState,
  type TaskHandleType,
  useEdgeDrawingContext,
} from "../contexts/edge-drawing-context";
import { useIsSelected, useSelectionContext } from "../contexts/selection-context";
import {
  RIGHT_BUTTON,
  TASK_GRPAHICS_HEIGHT,
  TASK_GRPAHICS_WIDTH,
  TASK_HANDLE_SIZE,
} from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiContainer } from "./pixi-app";
import { createMountAsChild } from "./utils/create-mount-as-child";
import { createObjectDrag } from "./utils/create-object-drag";
import { createPointerListeners } from "./utils/create-pointer-listeners";

const TASK_TEXT_FONT_SIZE = 16;

type TaskGraphicsProps = {
  task: TaskModel;
};

export const TaskGraphics: Component<TaskGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const isSelected = useIsSelected(() => props.task.id);
  const selection = useSelectionContext();

  const edgeDrawing = useEdgeDrawingContext();

  const taskContainer = new Container();
  createMountAsChild(container, taskContainer);

  const graphics = new Graphics();
  createMountAsChild(taskContainer, graphics);

  const style = new TextStyle({ fontSize: TASK_TEXT_FONT_SIZE });
  const title = new Text({ style });
  createMountAsChild(taskContainer, title);

  createEffect(() => {
    const isSelectedValue = isSelected();
    const themeValue = theme();

    graphics.clear();
    graphics
      .rect(0, 0, TASK_GRPAHICS_WIDTH, TASK_GRPAHICS_HEIGHT)
      .fill({ color: themeValue.taskBackgroundColor });

    if (isSelectedValue) {
      graphics.stroke({ color: themeValue.selectionColor, width: 2 });
    }
  });

  createEffect(() => {
    taskContainer.x = props.task.positionX;
    taskContainer.y = props.task.positionY;
  });

  createEffect(() => {
    title.text = `${props.task.title}\n${props.task.description}\n${props.task.estimate}\nX:${props.task.axisX}\nY:${props.task.axisY}`;
  });

  createObjectDrag(taskContainer, {
    onDragEnd: () => {
      taskCollection.update(props.task.id, (draft) => {
        draft.positionX = taskContainer.x;
        draft.positionY = taskContainer.y;
      });
    },
    onDragStart: () => {
      selection().setSelection([props.task.id]);
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
  source: DrawingState;
};

const EdgeDrawingListener: Component<EdgeDrawingListenerProps> = (props) => {
  const boardId = useBoardId();

  createPointerListeners(props.taskContainer, {
    onPointerUp: (event: FederatedMouseEvent) => {
      if (event.button === RIGHT_BUTTON) {
        return;
      }

      const isSource = props.source.handle === "left";

      edgeCollection.insert({
        boardId: boardId(),
        breakX: (props.source.positionX + event.x) / 2,
        id: createId(),
        source: isSource ? props.task.id : props.source.taskId,
        target: isSource ? props.source.taskId : props.task.id,
      });
    },
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
  createMountAsChild(props.taskContainer, graphics);

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

  createPointerListeners(graphics, {
    onPointerDown: (event: FederatedMouseEvent) => {
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
    },
  });

  return null;
};

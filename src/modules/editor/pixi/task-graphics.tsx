import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, onCleanup, onMount, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
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
      <TaskHandle positionX={0} taskContainer={taskContainer} />
      <TaskHandle positionX={TASK_GRPAHICS_WIDTH} taskContainer={taskContainer} />
    </>
  );
};

type TaskHandleProps = {
  taskContainer: Container;
  positionX: number;
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
  const theme = useBoardTheme();

  const graphics = new Graphics();

  createEffect(() => {
    const handleOffset = TASK_HANDLE_SIZE / 2;

    graphics.clear();
    graphics
      .rect(
        props.positionX - handleOffset,
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

  return null;
};

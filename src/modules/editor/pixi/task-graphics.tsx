import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, onCleanup, onMount, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { usePixiContainer } from "./pixi-app";
import { useDragObject } from "./use-drag-object";

type TaskGraphicsProps = {
  task: TaskModel;
};

export const TaskGraphics: Component<TaskGraphicsProps> = (props) => {
  const container = usePixiContainer();

  const taskContainer = new Container();
  const graphics = new Graphics();

  const style = new TextStyle({ fontSize: 16 });
  const title = new Text({ style });

  const drawGraphics = () => {
    graphics.clear();
    graphics.rect(0, 0, 200, 100).fill({ color: 0x998877 });
  };

  createEffect(() => {
    drawGraphics();
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
    onDragMove: () => {
      taskCollection.update(props.task.id, (draft) => {
        draft.positionX = graphics.x;
        draft.positionY = graphics.y;
      });
    },
  });

  return null;
};

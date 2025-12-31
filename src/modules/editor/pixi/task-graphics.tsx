import { Graphics } from "pixi.js";
import { createEffect, onCleanup, onMount, type Component } from "solid-js";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { useBoardTheme } from "./board-theme";
import { usePixiContainer } from "./pixi-app";

type TaskGraphicsProps = {
  task: TaskModel;
};

export const TaskGraphics: Component<TaskGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  const drawGraphics = () => {
    graphics.clear();
    graphics.rect(0, 0, 200, 100).fill({ color: 0x998877 });
  };

  createEffect(() => {
    drawGraphics();
  });

  createEffect(() => {
    graphics.x = props.task.positionX + 100;
    graphics.y = props.task.positionY + 100;
  });

  onMount(() => {
    container.addChild(graphics);
  });

  onCleanup(() => {
    container.removeChild(graphics);
    graphics.destroy();
  });

  return null;
};

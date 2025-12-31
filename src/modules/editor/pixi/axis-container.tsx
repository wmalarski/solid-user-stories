import { and, eq, useLiveQuery } from "@tanstack/solid-db";
import { Container, Graphics } from "pixi.js";
import { createEffect, For, onCleanup, onMount, type Component } from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useBoardId } from "../contexts/board-context";
import { useBoardTheme } from "./board-theme";
import { usePixiApp } from "./pixi-app";

export const AxisContainer: Component = () => {
  const app = usePixiApp();
  const theme = useBoardTheme();

  const axisContainer = new Container({
    zIndex: theme().axisContainerZIndex,
  });

  onMount(() => {
    app.stage.addChild(axisContainer);
  });

  onCleanup(() => {
    app.stage.removeChild(axisContainer);
  });

  return (
    <>
      <HorizontalAxisContainer axisContainer={axisContainer} />
      <VerticalAxisContainer axisContainer={axisContainer} />
    </>
  );
};

type HorizontalAxisContainerProps = {
  axisContainer: Container;
};

const HorizontalAxisContainer: Component<HorizontalAxisContainerProps> = (props) => {
  const boardId = useBoardId();

  const collection = useLiveQuery((q) =>
    q
      .from({ axis: axisCollection })
      .where(({ axis }) => and(eq(axis.boardId, boardId()), eq(axis.orientation, "horizontal"))),
  );

  return (
    <>
      <HorizontalAxisGraphics axisContainer={props.axisContainer} />
      <For each={collection.data}>
        {(axis) => <AxisGraphics axis={axis} axisContainer={props.axisContainer} />}
      </For>
    </>
  );
};

type HorizontalAxisGraphicsProps = {
  axisContainer: Container;
};

const HorizontalAxisGraphics: Component<HorizontalAxisGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  createEffect(() => {
    graphics.rect(0, 0, 500, 100).fill({ color: 0xaabbcc });
  });

  onMount(() => {
    props.axisContainer.addChild(graphics);
  });

  onCleanup(() => {
    props.axisContainer.removeChild(graphics);
    graphics.destroy();
  });

  return null;
};

type VerticalAxisContainerProps = {
  axisContainer: Container;
};

export const VerticalAxisContainer: Component<VerticalAxisContainerProps> = (props) => {
  const boardId = useBoardId();

  const collection = useLiveQuery((q) =>
    q
      .from({ axis: axisCollection })
      .where(({ axis }) => and(eq(axis.boardId, boardId()), eq(axis.orientation, "vertical"))),
  );

  return (
    <>
      <VerticalAxisGraphics axisContainer={props.axisContainer} />
      <For each={collection.data}>
        {(axis) => <AxisGraphics axis={axis} axisContainer={props.axisContainer} />}
      </For>
    </>
  );
};

type VerticalAxisGraphicsProps = {
  axisContainer: Container;
};

const VerticalAxisGraphics: Component<VerticalAxisGraphicsProps> = () => {
  return null;
};

type AxisGraphicsProps = {
  axisContainer: Container;
  axis: AxisModel;
};

const AxisGraphics: Component<AxisGraphicsProps> = () => {
  return null;
};

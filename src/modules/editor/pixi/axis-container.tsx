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
  const app = usePixiApp();
  const theme = useBoardTheme();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  const drawGraphics = (width = window.outerWidth) => {
    graphics.rect(100, 0, width - 100, 100).fill({ color: 0xaabbcc });
  };

  createEffect(() => {
    drawGraphics();
  });

  createEffect(() => {
    const listener = (screenWidth: number) => {
      drawGraphics(screenWidth);
    };
    app.renderer?.on("resize", listener);
    return () => {
      app.renderer?.off("resize", listener);
    };
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

const VerticalAxisGraphics: Component<VerticalAxisGraphicsProps> = (props) => {
  const app = usePixiApp();
  const theme = useBoardTheme();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  const drawGraphics = (height = window.outerHeight) => {
    graphics.rect(0, 100, 100, height - 100).fill({ color: 0xccbbaa });
  };

  createEffect(() => {
    drawGraphics();
  });

  createEffect(() => {
    const listener = (_screenWidth: number, screenHeigth: number) => {
      drawGraphics(screenHeigth);
    };
    app.renderer?.on("resize", listener);
    return () => {
      app.renderer?.off("resize", listener);
    };
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

type AxisGraphicsProps = {
  axisContainer: Container;
  axis: AxisModel;
};

const AxisGraphics: Component<AxisGraphicsProps> = () => {
  return null;
};

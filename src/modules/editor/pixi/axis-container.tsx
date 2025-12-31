import { and, eq, useLiveQuery } from "@tanstack/solid-db";
import { Container, Graphics } from "pixi.js";
import { createEffect, createMemo, For, onCleanup, onMount, type Component } from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useBoardId } from "../contexts/board-context";
import { useTransformState } from "../contexts/transform-state";
import { useBoardTheme } from "./board-theme";
import { usePixiApp } from "./pixi-app";

export const AxisContainer: Component = () => {
  const app = usePixiApp();
  const theme = useBoardTheme();

  const axisContainer = new Container({
    // x: 100,
    // y: 100,
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

const getPositions = (collection: AxisModel[]) => {
  return collection.reduce(
    (previous, current) => {
      const last = previous.at(-1) ?? 0;
      previous.push(last + current.size);
      return previous;
    },
    [100],
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

  const positions = createMemo(() => getPositions(collection.data));

  return (
    <>
      <HorizontalAxisGraphics axisContainer={props.axisContainer} />
      <For each={collection.data}>
        {(axis, index) => (
          <HorizontalAxisItemGraphics
            positionX={positions().at(index())}
            axis={axis}
            axisContainer={props.axisContainer}
          />
        )}
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
    graphics.rect(0, 0, width, 100).fill({ color: 0xaabbcc });
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

type HorizontalAxisItemGraphicsProps = {
  axisContainer: Container;
  axis: AxisModel;
  positionX?: number;
};

const HorizontalAxisItemGraphics: Component<HorizontalAxisItemGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const transform = useTransformState();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  createEffect(() => {
    graphics.clear();
    graphics.rect(props.positionX ?? 0, 0, props.axis.size, 100).fill({ color: 0x11dd99 });
  });

  createEffect(() => {
    const transformValue = transform();
    graphics.x = transformValue.x();
    graphics.scale.set(transformValue.scale(), 1);
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

  const positions = createMemo(() => getPositions(collection.data));

  return (
    <>
      <VerticalAxisGraphics axisContainer={props.axisContainer} />
      <For each={collection.data}>
        {(axis, index) => (
          <VerticalAxisItemGraphics
            positionY={positions().at(index())}
            axis={axis}
            axisContainer={props.axisContainer}
          />
        )}
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
    graphics.rect(0, 0, 100, height).fill({ color: 0xccbbaa });
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

type VerticalAxisItemGraphicsProps = {
  axisContainer: Container;
  axis: AxisModel;
  positionY?: number;
};

const VerticalAxisItemGraphics: Component<VerticalAxisItemGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const transform = useTransformState();

  const graphics = new Graphics({ zIndex: theme().axisContainerZIndex });

  createEffect(() => {
    graphics.clear();
    graphics.rect(0, props.positionY ?? 0, 100, props.axis.size).fill({ color: 0xffeedd });
  });

  createEffect(() => {
    const transformValue = transform();
    graphics.y = transformValue.y();
    graphics.scale.set(1, transformValue.scale());
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

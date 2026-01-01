import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, For, onCleanup, onMount, type Component } from "solid-js";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useTransformPoint, useTransformState } from "../contexts/transform-state";
import { AXIS_CONTAINER_ZINDEX, AXIS_OFFSET } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiApp } from "./pixi-app";

type AxisContainerProps = {
  horizontal: AxisModel[];
  horizontalPositions: number[];
  vertical: AxisModel[];
  verticalPositions: number[];
};

export const AxisContainer: Component<AxisContainerProps> = (props) => {
  const app = usePixiApp();

  const axisContainer = new Container({
    zIndex: AXIS_CONTAINER_ZINDEX,
  });

  onMount(() => {
    app.stage.addChild(axisContainer);
  });

  onCleanup(() => {
    app.stage.removeChild(axisContainer);
  });

  return (
    <>
      <AxisContent
        collection={props.horizontal}
        positions={props.horizontalPositions}
        axisContainer={axisContainer}
        orientation="horizontal"
      />
      <AxisContent
        collection={props.vertical}
        positions={props.verticalPositions}
        axisContainer={axisContainer}
        orientation="vertical"
      />
    </>
  );
};

type AxisContentProps = {
  axisContainer: Container;
  collection: AxisModel[];
  positions: number[];
  orientation: AxisModel["orientation"];
};

const AxisContent: Component<AxisContentProps> = (props) => {
  return (
    <>
      <AxisGrid
        axisContainer={props.axisContainer}
        orientation={props.orientation}
        positions={props.positions}
      />
      <AxisGraphics axisContainer={props.axisContainer} orientation={props.orientation} />
      <For each={props.collection}>
        {(axis, index) => (
          <AxisItemGraphics
            position={props.positions.at(index())}
            axis={axis}
            orientation={props.orientation}
            axisContainer={props.axisContainer}
          />
        )}
      </For>
    </>
  );
};

type AxisGraphicsProps = {
  axisContainer: Container;
  orientation: AxisModel["orientation"];
};

const AxisGraphics: Component<AxisGraphicsProps> = (props) => {
  const app = usePixiApp();

  const theme = useBoardTheme();

  const graphics = new Graphics();

  const drawGraphics = (screenWidth?: number, screenHeight?: number) => {
    graphics.clear();

    if (props.orientation === "vertical") {
      graphics.rect(0, 0, AXIS_OFFSET, screenHeight ?? window.outerHeight);
    } else {
      graphics.rect(0, 0, screenWidth ?? window.outerWidth, AXIS_OFFSET);
    }

    graphics.fill({ color: theme().axisBoackgroundColor });
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
  });

  return null;
};

type VerticalAxisContainerProps = {
  axisContainer: Container;
  collection: AxisModel[];
  positions: number[];
};

export const VerticalAxisContainer: Component<VerticalAxisContainerProps> = (props) => {
  return (
    <>
      <AxisGrid
        axisContainer={props.axisContainer}
        orientation="vertical"
        positions={props.positions}
      />
      <AxisGraphics axisContainer={props.axisContainer} orientation="vertical" />
      <For each={props.collection}>
        {(axis, index) => (
          <AxisItemGraphics
            axis={axis}
            axisContainer={props.axisContainer}
            position={props.positions.at(index())}
            orientation="vertical"
          />
        )}
      </For>
    </>
  );
};

type AxisItemGraphicsProps = {
  axisContainer: Container;
  axis: AxisModel;
  position?: number;
  orientation: AxisModel["orientation"];
};

const AxisItemGraphics: Component<AxisItemGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const transform = useTransformState();
  const transformPoint = useTransformPoint();

  const itemContainer = new Container();
  const graphics = new Graphics();

  createEffect(() => {
    const transformValue = transform();
    graphics.clear();

    if (props.orientation === "vertical") {
      graphics.rect(0, 0, AXIS_OFFSET, props.axis.size * transformValue.scale());
    } else {
      graphics.rect(0, 0, props.axis.size * transformValue.scale(), AXIS_OFFSET);
    }

    graphics.fill({ color: theme().axisItemBoackgroundColor });
  });

  createEffect(() => {
    const point = transformPoint({
      x: (props.position ?? 0) + AXIS_OFFSET,
      y: (props.position ?? 0) + AXIS_OFFSET,
    });

    if (props.orientation === "vertical") {
      itemContainer.y = point.y;
    } else {
      itemContainer.x = point.x;
    }
  });

  onMount(() => {
    itemContainer.addChild(graphics);
    props.axisContainer.addChild(itemContainer);
  });

  onCleanup(() => {
    itemContainer.removeChild(graphics);
    props.axisContainer.removeChild(itemContainer);
  });

  return <AxisNameText axis={props.axis} itemContainer={itemContainer} />;
};

type AxisNameTextProps = {
  axis: AxisModel;
  itemContainer: Container;
};

const AxisNameText: Component<AxisNameTextProps> = (props) => {
  const style = new TextStyle({ fontSize: 16 });
  const title = new Text({ style });

  createEffect(() => {
    title.text = props.axis.name;
  });

  onMount(() => {
    props.itemContainer.addChild(title);
  });

  onCleanup(() => {
    props.itemContainer.removeChild(title);
  });

  return null;
};

type AxisGridProps = {
  axisContainer: Container;
  orientation: AxisModel["orientation"];
  positions: number[];
};

export const AxisGrid: Component<AxisGridProps> = (props) => {
  return (
    <For each={props.positions}>
      {(position) => (
        <AxisGridItem
          axisContainer={props.axisContainer}
          orientation={props.orientation}
          position={position}
        />
      )}
    </For>
  );
};

type AxisGridItemProps = {
  position: number;
  orientation: AxisModel["orientation"];
  axisContainer: Container;
};

const AxisGridItem: Component<AxisGridItemProps> = (props) => {
  const theme = useBoardTheme();

  const transformPoint = useTransformPoint();

  const graphics = new Graphics();

  createEffect(() => {
    graphics.clear();

    const position = transformPoint({
      x: props.position + AXIS_OFFSET,
      y: props.position + AXIS_OFFSET,
    });

    if (props.orientation === "vertical") {
      graphics.moveTo(0, position.y).lineTo(window.outerWidth, position.y);
    } else {
      graphics.moveTo(position.x, 0).lineTo(position.x, window.outerHeight);
    }

    graphics.stroke({ color: theme().axisGridColor });
  });

  onMount(() => {
    props.axisContainer.addChild(graphics);
  });

  onCleanup(() => {
    props.axisContainer.removeChild(graphics);
  });

  return null;
};

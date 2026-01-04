import { Container, DOMContainer, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, For, type Component } from "solid-js";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { AxisDropdown } from "../components/axis-dialogs";
import { useBoardContext } from "../contexts/board-context";
import { useTransformPoint, useTransformState } from "../contexts/transform-state";
import { AXIS_CONTAINER_ZINDEX, AXIS_OFFSET } from "../utils/constants";
import { useBoardTheme } from "./board-theme";
import { usePixiApp } from "./pixi-app";
import { createMountAsChild } from "./utils/create-mount-as-child";

export const AxisContainer: Component = () => {
  const app = usePixiApp();

  const axisContainer = new Container({ zIndex: AXIS_CONTAINER_ZINDEX });
  createMountAsChild(app.stage, axisContainer);

  return (
    <>
      <AxisContent axisContainer={axisContainer} orientation="horizontal" />
      <AxisContent axisContainer={axisContainer} orientation="vertical" />
    </>
  );
};

type AxisContentProps = {
  axisContainer: Container;
  orientation: AxisModel["orientation"];
};

const AxisContent: Component<AxisContentProps> = (props) => {
  const boardContext = useBoardContext();

  return (
    <>
      <AxisGrid axisContainer={props.axisContainer} orientation={props.orientation} />
      <AxisGraphics axisContainer={props.axisContainer} orientation={props.orientation} />
      <For each={boardContext().axis[props.orientation].axis}>
        {(axis, index) => (
          <AxisItemGraphics
            position={boardContext().axis[props.orientation].positions.at(index())}
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
  createMountAsChild(props.axisContainer, graphics);

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

  return null;
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
  createMountAsChild(props.axisContainer, itemContainer);

  const graphics = new Graphics();
  createMountAsChild(itemContainer, graphics);

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

  return (
    <>
      <AxisNameText axis={props.axis} itemContainer={itemContainer} />
      <AxisMenu axis={props.axis} itemContainer={itemContainer} />
    </>
  );
};

type AxisNameTextProps = {
  axis: AxisModel;
  itemContainer: Container;
};

const AxisNameText: Component<AxisNameTextProps> = (props) => {
  const style = new TextStyle({ fontSize: 16 });

  const title = new Text({ style });
  createMountAsChild(props.itemContainer, title);

  createEffect(() => {
    title.text = props.axis.name;
  });

  return null;
};

type AxisMenuProps = {
  axis: AxisModel;
  itemContainer: Container;
};

const AxisMenu: Component<AxisMenuProps> = (props) => {
  const transform = useTransformState();

  const element = (
    <div>
      <AxisDropdown axis={props.axis} />
    </div>
  );

  const domContainer = new DOMContainer({
    anchor: { x: 1, y: 0 },
    element: element as HTMLElement,
    y: 0,
  });

  createEffect(() => {
    const transformValue = transform();

    domContainer.x =
      props.axis.orientation === "horizontal"
        ? props.axis.size * transformValue.scale()
        : AXIS_OFFSET;
  });

  createMountAsChild(props.itemContainer, domContainer);

  return null;
};

type AxisGridProps = {
  axisContainer: Container;
  orientation: AxisModel["orientation"];
};

export const AxisGrid: Component<AxisGridProps> = (props) => {
  const boardContext = useBoardContext();

  return (
    <For each={boardContext().axis[props.orientation].positions}>
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
  createMountAsChild(props.axisContainer, graphics);

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

  return null;
};

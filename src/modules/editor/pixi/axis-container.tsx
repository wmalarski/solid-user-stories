import { Container, DOMContainer, Graphics, Text, TextStyle } from "pixi.js";
import { createEffect, createMemo, For, type Component } from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { AxisDropdown } from "../components/axis-dialogs";
import { useBoardContext } from "../contexts/board-context";
import { useTransformPoint, useTransformState } from "../contexts/transform-state";
import { AXIS_CONTAINER_ZINDEX, AXIS_OFFSET } from "../utils/constants";
import { subtractPoint } from "../utils/geometry";
import { useBoardTheme } from "./board-theme";
import { usePixiApp, usePixiContainer } from "./pixi-app";
import { createMountAsChild } from "./utils/create-mount-as-child";
import { createObjectDrag } from "./utils/create-object-drag";

export const AxisContainer: Component = () => {
  const container = usePixiContainer();

  const axisContainer = new Container({ zIndex: AXIS_CONTAINER_ZINDEX });
  createMountAsChild(container, axisContainer);

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
      <AxisGraphics orientation={props.orientation} />
      <For each={boardContext().axis[props.orientation].axis}>
        {(axis, index) => (
          <AxisItemGraphics
            position={boardContext().axis[props.orientation].positions.at(index())}
            axis={axis}
            orientation={props.orientation}
          />
        )}
      </For>
      <AxisGrid orientation={props.orientation} />
    </>
  );
};

type AxisGraphicsProps = {
  orientation: AxisModel["orientation"];
};

const AxisGraphics: Component<AxisGraphicsProps> = (props) => {
  const app = usePixiApp();
  const container = usePixiContainer();

  const theme = useBoardTheme();

  const graphics = new Graphics({ parent: container });

  const drawGraphics = (screenWidth?: number, screenHeight?: number) => {
    graphics.clear();

    if (props.orientation === "vertical") {
      graphics.rect(-AXIS_OFFSET, -AXIS_OFFSET, AXIS_OFFSET, screenHeight ?? window.outerHeight);
    } else {
      graphics.rect(-AXIS_OFFSET, -AXIS_OFFSET, screenWidth ?? window.outerWidth, AXIS_OFFSET);
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
  axis: AxisModel;
  position?: number;
  orientation: AxisModel["orientation"];
};

const AxisItemGraphics: Component<AxisItemGraphicsProps> = (props) => {
  const theme = useBoardTheme();

  const container = usePixiContainer();

  const transform = useTransformState();
  const transformPoint = useTransformPoint();

  const itemContainer = new Container({ parent: container });
  const graphics = new Graphics({ parent: itemContainer });

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
    const point = transformPoint({ x: props.position ?? 0, y: props.position ?? 0 });

    if (props.orientation === "vertical") {
      itemContainer.y = point.y;
      itemContainer.x = -AXIS_OFFSET;
    } else {
      itemContainer.x = point.x;
      itemContainer.y = -AXIS_OFFSET;
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
  createMountAsChild(() => props.itemContainer, title);

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

  const domContainer = new DOMContainer({ element: element as HTMLElement, x: 0, y: 4 });

  createEffect(() => {
    const transformValue = transform();

    domContainer.x =
      props.axis.orientation === "horizontal"
        ? props.axis.size * transformValue.scale() - 28
        : AXIS_OFFSET - 28;
  });

  createMountAsChild(() => props.itemContainer, domContainer);

  return null;
};

type AxisGridProps = {
  orientation: AxisModel["orientation"];
};

export const AxisGrid: Component<AxisGridProps> = (props) => {
  const boardContext = useBoardContext();

  const config = createMemo(() => {
    return boardContext().axis[props.orientation];
  });

  return (
    <For each={config().positions}>
      {(position, index) => (
        <AxisGridItem
          axisId={config().axis[index() - 1]?.id}
          orientation={props.orientation}
          position={position}
        />
      )}
    </For>
  );
};

type AxisGridItemProps = {
  axisId: string;
  position: number;
  orientation: AxisModel["orientation"];
};

const AxisGridItem: Component<AxisGridItemProps> = (props) => {
  const theme = useBoardTheme();

  const transformPoint = useTransformPoint();

  const container = usePixiContainer();

  const graphics = new Graphics();
  createMountAsChild(container, graphics);

  createEffect(() => {
    graphics.clear();

    const position = transformPoint({
      x: props.position,
      y: props.position,
    });

    if (props.orientation === "vertical") {
      graphics.moveTo(0, position.y).lineTo(window.outerWidth, position.y);
    } else {
      graphics.moveTo(position.x, 0).lineTo(position.x, window.outerHeight);
    }

    graphics.stroke({ color: theme().axisGridColor, width: 2 });
  });

  createEffect(() => {
    if (props.position === 0) {
      return;
    }

    createObjectDrag(graphics, {
      dragConstraint: (args) => {
        const other =
          props.orientation === "vertical"
            ? { x: args.eventPosition.x, y: args.shift.y }
            : { x: args.shift.x, y: args.eventPosition.y };
        return subtractPoint(args.eventPosition, other);
      },
      onDragEnd: (event) => {
        // taskCollection.update(props.task.id, (draft) => {
        //   draft.positionX = taskContainer.x;
        //   draft.positionY = taskContainer.y;
        // });
        // const position = transformPoint(event);
        const position2 = transformPoint(event, true);

        const diff = position2.x - props.position - AXIS_OFFSET;

        axisCollection.update(props.axisId, (draft) => {
          draft.size += diff;
        });

        // console.log("[onDragEnd]", event, props.position, event.x, position2.x, diff);
      },
      // onDragStart: (event) => {
      //   // taskCollection.update(props.task.id, (draft) => {
      //   //   draft.positionX = taskContainer.x;
      //   //   draft.positionY = taskContainer.y;
      //   // });

      //   const position = transformPoint(event);
      //   const position2 = transformPoint(event, true);

      //   console.log("[onDragStart]", event, props.position, event.x, position.x, position2.x);
      // },
    });
  });

  return null;
};

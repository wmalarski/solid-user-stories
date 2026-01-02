import type { Container, FederatedMouseEvent, FederatedPointerEvent } from "pixi.js";

import { createSignal, onCleanup, onMount } from "solid-js";
import { RIGHT_BUTTON } from "../../utils/constants";
import { subtractPoint } from "../../utils/geometry";
import type { Point2D } from "../../utils/types";
import { usePixiApp } from "../pixi-app";

type DragConstraintArgs = {
  eventPosition: Point2D;
  shift: Point2D;
};

const defaultDragConstraint = (args: DragConstraintArgs) => {
  return subtractPoint(args.eventPosition, args.shift);
};

type CreateObjectDragArgs = {
  dragConstraint?: (args: DragConstraintArgs) => Point2D;
  onDragEnd?: (event: FederatedMouseEvent) => void;
  onDragMove?: (event: FederatedMouseEvent) => void;
  onDragStart?: (event: FederatedMouseEvent) => void;
};

export const createObjectDrag = (displayObject: Container, args: CreateObjectDragArgs) => {
  const app = usePixiApp();

  const [shift, setShift] = createSignal<Point2D>();

  const onDragMove = (event: FederatedPointerEvent) => {
    const point = shift();
    const parent = displayObject.parent;
    if (!point || !parent) {
      return;
    }

    const local = parent.toLocal(event.global);
    const dragConstraint = args.dragConstraint || defaultDragConstraint;
    const afterConstraint = dragConstraint({
      eventPosition: local,
      shift: point,
    });

    displayObject.position.set(afterConstraint.x, afterConstraint.y);

    args.onDragMove?.(event);
  };

  const onDragEnd = (event: FederatedMouseEvent) => {
    const parent = displayObject.parent;

    if (!parent) {
      return;
    }

    parent.off("pointermove", onDragMove);
    parent.off("pointerup", onDragEnd);
    parent.off("pointerupoutside", onDragEnd);

    setShift();
    args.onDragEnd?.(event);

    app.canvas.style.cursor = "default";
  };

  const onPointerDown = (event: FederatedMouseEvent) => {
    const parent = displayObject.parent;

    if (event.button === RIGHT_BUTTON || !parent) {
      return;
    }

    event.stopPropagation();

    const transform = parent.worldTransform;
    const inverted = transform.applyInverse(event.global);

    setShift(subtractPoint(inverted, displayObject));

    parent.on("pointermove", onDragMove);
    parent.once("pointerup", onDragEnd);
    parent.once("pointerupoutside", onDragEnd);

    args.onDragStart?.(event);

    app.canvas.style.cursor = "grab";
  };

  onMount(() => {
    displayObject.on("pointerdown", onPointerDown);
  });

  onCleanup(() => {
    displayObject.off("pointerdown", onPointerDown);
  });
};

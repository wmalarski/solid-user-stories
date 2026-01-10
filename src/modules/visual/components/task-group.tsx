import { createWritableMemo } from "@solid-primitives/memo";
import * as d3 from "d3";
import { createMemo, createSignal, type Component } from "solid-js";
import {
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { createDrag } from "../utils/create-drag";

type TaskGroupProps = {
  x: number;
  y: number;
  index: number;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const [x, setX] = createWritableMemo(() => props.x);
  const [y, setY] = createWritableMemo(() => props.y);

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  createDrag({
    onDragStarted(event) {
      setShiftX(x() - event.x);
      setShiftY(y() - event.y);
    },
    onDragged(event) {
      setX(event.x + shiftX());
      setY(event.y + shiftY());
    },
    ref: rectRef,
  });

  return (
    <>
      <rect
        ref={setRectRef}
        x={x()}
        y={y()}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        fill={d3.interpolateRainbow(props.index / 360)}
      />
      <TaskHandle kind="source" x={x()} y={y()} />
      <TaskHandle kind="target" x={x()} y={y()} />
    </>
  );
};

type TaskHandleProps = {
  x: number;
  y: number;
  kind: "source" | "target";
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
  const [_rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const yShift = createMemo(
    () => (props.kind === "source" ? TASK_RECT_WIDTH : 0) - TASK_HANDLE_SIZE_HALF,
  );

  return (
    <rect
      ref={setRectRef}
      x={props.x + yShift()}
      y={props.y + TASK_HANDLE_Y_SHIFT}
      width={TASK_HANDLE_SIZE}
      height={TASK_HANDLE_SIZE}
      fill="blue"
    />
  );
};

import { createWritableMemo } from "@solid-primitives/memo";
import * as d3 from "d3";
import { createSignal, type Component } from "solid-js";
import { TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "../utils/constants";
import { createDrag } from "../utils/create-drag";

type TaskGroupProps = {
  x: number;
  y: number;
  index: number;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [circleRef, setCircleRef] = createSignal<SVGCircleElement>();

  const [x, setX] = createWritableMemo(() => props.x);
  const [y, setY] = createWritableMemo(() => props.y);

  createDrag({
    onDragged(point) {
      setX(point.x);
      setY(point.y);
    },
    ref: circleRef,
  });

  return (
    <>
      <rect
        ref={setCircleRef}
        x={x()}
        y={y()}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        fill={d3.interpolateRainbow(props.index / 360)}
      />
    </>
  );
};

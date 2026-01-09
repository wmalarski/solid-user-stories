import { createWritableMemo } from "@solid-primitives/memo";
import * as d3 from "d3";
import { createSignal, For, type Component } from "solid-js";
import { createDrag } from "../utils/create-drag";
import { createZoom } from "../utils/create-zoom";
import { DragGroup } from "./drag-group";
import { TaskGroup } from "./task-group";

export const VisualPanel: Component = () => {
  return <DragAndDropExample />;
};

const DragAndDropExample: Component = () => {
  const radius = 6;
  const step = radius * 2;
  const theta = Math.PI * (3 - Math.sqrt(5));
  const height = 500;
  const width = 500;

  const data = Array.from({ length: 2000 }, (_, i) => {
    const radius = step * Math.sqrt(i + 0.5);
    const a = theta * i;
    return {
      x: width / 2 + radius * Math.cos(a),
      y: height / 2 + radius * Math.sin(a),
    };
  });

  const [svgRef, setSvgRef] = createSignal<SVGSVGElement>();
  const [transform, setTransform] = createSignal<string>();

  createZoom({
    height: () => height,
    onZoomed: setTransform,
    ref: svgRef,
    width: () => width,
  });

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <DragGroup transform={transform()}>
        <For each={data}>
          {(point, index) => <Circle radius={radius} x={point.x} y={point.y} index={index()} />}
        </For>
        <rect x={100} y={150} width={200} height={100} fill="red" />
        <TaskGroup index={240} x={123} y={456} />
      </DragGroup>
      <rect x={100} y={150} width={200} height={100} fill="blue" />
    </svg>
  );
};

type CircleProps = {
  x: number;
  y: number;
  index: number;
  radius: number;
};

const Circle: Component<CircleProps> = (props) => {
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
    <circle
      ref={setCircleRef}
      cx={x()}
      cy={y()}
      r={props.radius}
      fill={d3.interpolateRainbow(props.index / 360)}
    />
  );
};

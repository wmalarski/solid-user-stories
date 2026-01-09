import { createWritableMemo } from "@solid-primitives/memo";
import * as d3 from "d3";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type Component,
  type ComponentProps,
} from "solid-js";
import { createDrag } from "../utils/create-drag";
import { createZoom } from "../utils/create-zoom";
import { TaskGroup } from "./task-group";

export const VisualPanel: Component = () => {
  return <DragAndDropExample />;
};

export const LinearPlotExample: Component = () => {
  // oxlint-disable-next-line no-array-callback-reference
  const [data, setData] = createSignal(d3.ticks(-2, 2, 200).map(Math.sin));

  const onMouseMove: ComponentProps<"div">["onMouseMove"] = (event) => {
    const [x, y] = d3.pointer(event);
    setData([...data().slice(-200), Math.atan2(x, y)]);
  };

  return (
    <div onMouseMove={onMouseMove}>
      <LinePlot data={data()} />
    </div>
  );
};

type LinePlotProps = {
  data: number[];
};

const LinePlot: Component<LinePlotProps> = (props) => {
  const width = 640;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

  const [gx, setGx] = createSignal<SVGGElement>();
  const [gy, setGy] = createSignal<SVGGElement>();

  const dataLength = createMemo(() => {
    return props.data.length;
  });

  const x = createMemo(() => {
    return d3.scaleLinear([0, dataLength() - 1], [marginLeft, width - marginRight]);
  });

  const y = createMemo(() => {
    return d3.scaleLinear(d3.extent(props.data) as [number, number], [
      height - marginBottom,
      marginTop,
    ]);
  });

  const line = createMemo(() => {
    return d3.line((_d, i) => x()(i), y());
  });

  createEffect(() => {
    const element = gx();
    if (element) {
      d3.select(element).call(d3.axisBottom(x()));
    }
  });

  createEffect(() => {
    const element = gy();
    if (element) {
      d3.select(element).call(d3.axisLeft(y()));
    }
  });

  return (
    <svg class="w-screen h-screen">
      <g ref={setGx} transform={`translate(0,${height - marginBottom})`} />
      <g ref={setGy} transform={`translate(${marginLeft},0)`} />
      <path fill="none" stroke="currentColor" stroke-width="1.5" d={line()(props.data) as string} />
      <g fill="white" stroke="currentColor" stroke-width="1.5">
        <For each={props.data}>
          {(d, index) => <circle cx={x()(index())} cy={y()(d)} r="2.5" />}
        </For>
      </g>
    </svg>
  );
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
  const [isDragging, setIsDragging] = createSignal(false);
  const [transform, setTransform] = createSignal<string>();

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  createZoom({
    height: () => height,
    onZoomed: setTransform,
    ref: svgRef,
    width: () => width,
  });

  return (
    <svg ref={setSvgRef} class="w-screen h-screen">
      <g transform={transform()} cursor={isDragging() ? "grabbing" : "grab"}>
        <For each={data}>
          {(point, index) => (
            <Circle
              onDragEnd={onDragEnd}
              onDragStart={onDragStart}
              radius={radius}
              x={point.x}
              y={point.y}
              index={index()}
            />
          )}
        </For>
        <rect x={100} y={150} width={200} height={100} fill="red" />
        <TaskGroup index={240} onDragEnd={onDragEnd} onDragStart={onDragStart} x={123} y={456} />
      </g>
      <rect x={100} y={150} width={200} height={100} fill="blue" />
    </svg>
  );
};

type CircleProps = {
  x: number;
  y: number;
  index: number;
  radius: number;
  onDragStart: () => void;
  onDragEnd: () => void;
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

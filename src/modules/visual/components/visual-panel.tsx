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
  // const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  // const g = svg.append("g").attr("cursor", "grab");

  // g.selectAll("circle")
  //   .data(data)
  //   .join("circle")
  //   .attr("cx", ({ x }) => x)
  //   .attr("cy", ({ y }) => y)
  //   .attr("r", radius)
  //   .attr("fill", (d, i) => d3.interpolateRainbow(i / 360))
  //   .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

  // svg.call(
  //   d3
  //     .zoom()
  //     .extent([
  //       [0, 0],
  //       [width, height],
  //     ])
  //     .scaleExtent([1, 8])
  //     .on("zoom", zoomed),
  // );

  // function dragstarted() {
  //   d3.select(this).raise();
  //   g.attr("cursor", "grabbing");
  // }

  // const dragged = (event, d) => {
  //   d3.select(this)
  //     .attr("cx", (d.x = event.x))
  //     .attr("cy", (d.y = event.y));
  // }

  // const dragended = () => {
  //   g.attr("cursor", "grab");
  // }

  // // oxlint-disable-next-line no-explicit-any
  // const zoomed = ({ transform }: any) => {
  //   g.attr("transform", transform);
  // };

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

  const onZoomed = ({ transform }: { transform: string }) => {
    setTransform(transform);
  };

  createEffect(() => {
    const svgRefValue = svgRef();

    if (!svgRefValue) {
      return;
    }

    const plugin = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([1, 8])
      .on("zoom", onZoomed);

    // oxlint-disable-next-line no-explicit-any
    d3.select(svgRefValue).call(plugin as any);
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
      </g>
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

  const onDragStarted = () => {
    const circleRefValue = circleRef();
    if (circleRefValue) {
      d3.select(circleRefValue).raise();
      props.onDragStart();
    }
  };

  const onDragged = (event: { x: number; y: number }) => {
    setX(event.x);
    setY(event.y);
  };

  const onDragEnded = () => {
    props.onDragEnd();
  };

  createEffect(() => {
    const circleRefValue = circleRef();
    if (!circleRefValue) {
      return;
    }

    const plugin = d3
      .drag()
      .on("start", onDragStarted)
      .on("drag", onDragged)
      .on("end", onDragEnded);

    // oxlint-disable-next-line no-explicit-any
    d3.select(circleRefValue).call(plugin as any);
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

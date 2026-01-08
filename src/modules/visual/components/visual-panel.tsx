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
    <svg width={width} height={height}>
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

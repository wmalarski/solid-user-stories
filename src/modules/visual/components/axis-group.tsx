import { createMemo, Index, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { Badge } from "~/ui/badge/badge";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_X_OFFSET, AXIS_Y_OFFSET } from "../utils/constants";
import { DeleteAxisDialog, InsertAxisDialog, UpdateAxisDialog } from "./axis-dialogs";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  const xLength = createMemo(() => axisConfig().x.length);
  const yLength = createMemo(() => axisConfig().y.length);

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={axisConfig().x}>
        {(entry) => <HorizontalItemRect totalLength={xLength()} config={entry()} />}
      </Index>
      <Index each={axisConfig().y}>
        {(entry) => <VerticalItemRect totalLength={yLength()} config={entry()} />}
      </Index>
      <CenterRect />
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  return (
    <>
      <rect
        class="opacity-30"
        x={AXIS_X_OFFSET}
        y={0}
        height={AXIS_Y_OFFSET - 2}
        width="100%"
        filter="url(#task-shadow)"
      />
      <rect class="fill-base-300" x={0} y={0} height={AXIS_Y_OFFSET} width="100%" />
    </>
  );
};

const VerticalBackgroundRect: Component = () => {
  return (
    <>
      <rect
        class="opacity-40"
        x={0}
        y={AXIS_Y_OFFSET}
        height="100%"
        width={AXIS_X_OFFSET - 2}
        filter="url(#task-shadow)"
      />
      <rect class="fill-base-300" x={0} y={0} height="100%" width={AXIS_X_OFFSET} />
    </>
  );
};

type HorizontalItemRectProps = {
  config: AxisConfig;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() => translateX(transform(), props.config.start + AXIS_X_OFFSET));

  const width = createMemo(() => props.config.axis.size * transform().k);

  return (
    <>
      <foreignObject width={width()} x={transformed()} y={0} height={AXIS_Y_OFFSET}>
        <AxisItemContent config={props.config} totalLength={props.totalLength} />
      </foreignObject>
    </>
  );
};

type VerticalItemRectProps = {
  config: AxisConfig;
  totalLength: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() => translateY(transform(), props.config.start + AXIS_Y_OFFSET));

  const height = createMemo(() => props.config.axis.size * transform().k);

  return (
    <>
      <foreignObject height={height()} x={0} y={transformed()} width={AXIS_X_OFFSET}>
        <AxisItemContent config={props.config} totalLength={props.totalLength} />
      </foreignObject>
    </>
  );
};

type AxisItemContentProps = {
  config: AxisConfig;
  totalLength: number;
};

const AxisItemContent: Component<AxisItemContentProps> = (props) => {
  const boardState = useBoardStateContext();

  const isVertical = createMemo(() => {
    return props.config.axis.orientation === "vertical";
  });

  const tasks = createMemo(() => {
    const isVerticalValue = isVertical();
    const axisId = props.config.axis.id;
    return boardState
      .tasks()
      .filter((entry) => (isVerticalValue ? entry.axisY === axisId : entry.axisX === axisId));
  });

  const esitmationSum = createMemo(() => {
    return tasks().reduce((previous, current) => previous + current.estimate, 0);
  });

  return (
    <div class="bg-base-200 w-full h-full grid grid-cols-1 grid-rows-[1fr_auto] p-2">
      <span class="text-sm truncate font-semibold">{props.config.axis.name}</span>
      {/* <span>{props.config.axis.id}</span> */}
      <div
        class={cx("flex gap-1 justify-end", {
          "flex-col items-end": isVertical(),
          "items-center": !isVertical(),
        })}
      >
        <InsertAxisDialog orientation={props.config.axis.orientation} index={props.config.index} />
        <UpdateAxisDialog axis={props.config.axis} />
        <Show when={props.totalLength > 1 && tasks().length === 0}>
          <DeleteAxisDialog axis={props.config.axis} endPosition={props.config.end} />
        </Show>
        <Badge size="sm" color="accent" class="my-1">
          {esitmationSum()}
        </Badge>
      </div>
    </div>
  );
};

const CenterRect: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <foreignObject x={0} y={0} width={AXIS_X_OFFSET} height={AXIS_Y_OFFSET}>
        <div class="grid grid-cols-1 grid-rows-[auto_1fr] p-1 bg-base-300 text-base-content w-full h-full">
          <span class="font-semibold truncate">{boardState.board().title}</span>
          <span class="text-sm line-clamp-2 opacity-80">{boardState.board().description}</span>
        </div>
      </foreignObject>
    </>
  );
};

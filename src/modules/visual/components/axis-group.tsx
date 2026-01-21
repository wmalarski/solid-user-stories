import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Index, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { Badge } from "~/ui/badge/badge";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { useBoardModelContext } from "../contexts/board-model";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_X_OFFSET, AXIS_Y_OFFSET } from "../utils/constants";
import { DeleteAxisDialog, InsertAxisDialog, UpdateAxisDialog } from "./axis-dialogs";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  const xLength = createMemo(() => axisConfig().config.x.length);
  const yLength = createMemo(() => axisConfig().config.y.length);

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={axisConfig().config.x}>
        {(entry, index) => (
          <HorizontalItemRect totalLength={xLength()} config={entry()} index={index} />
        )}
      </Index>
      <Index each={axisConfig().config.y}>
        {(entry, index) => (
          <VerticalItemRect totalLength={yLength()} config={entry()} index={index} />
        )}
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
  index: number;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(boardTransform().transform, props.config.start + AXIS_X_OFFSET),
  );

  const width = createMemo(() => props.config.axis.size * boardTransform().transform.k);

  return (
    <>
      <foreignObject width={width()} x={transformed()} y={0} height={AXIS_Y_OFFSET}>
        <AxisItemContent
          config={props.config}
          index={props.index}
          totalLength={props.totalLength}
        />
      </foreignObject>
    </>
  );
};

type VerticalItemRectProps = {
  config: AxisConfig;
  index: number;
  totalLength: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(boardTransform().transform, props.config.start + AXIS_Y_OFFSET),
  );

  return (
    <>
      <foreignObject
        height={props.config.axis.size * boardTransform().transform.k}
        x={0}
        y={transformed()}
        width={AXIS_X_OFFSET}
      >
        <AxisItemContent
          config={props.config}
          index={props.index}
          totalLength={props.totalLength}
        />
      </foreignObject>
    </>
  );
};

type AxisItemContentProps = {
  config: AxisConfig;
  index: number;
  totalLength: number;
};

const AxisItemContent: Component<AxisItemContentProps> = (props) => {
  const tasks = useLiveQuery((q) =>
    q
      .from({ tasks: taskCollection })
      .where(({ tasks }) =>
        props.config.axis.orientation === "horizontal"
          ? eq(tasks.axisX, props.config.axis.id)
          : eq(tasks.axisY, props.config.axis.id),
      ),
  );

  const esitmationSum = createMemo(() => {
    return tasks().reduce((previous, current) => previous + current.estimate, 0);
  });

  const isVertical = createMemo(() => {
    return props.config.axis.orientation === "vertical";
  });

  return (
    <div class="bg-base-200 w-full h-full grid grid-cols-1 grid-rows-[1fr_auto] p-2">
      <span class="text-sm truncate font-semibold">{props.config.axis.name}</span>
      {/* <span>{props.config.axis.id}</span> */}
      <div
        class={cx("flex justify-end gap-2", {
          "items-center": !isVertical(),
          "items-end": isVertical(),
        })}
      >
        <Badge size="sm" color="info" class="mb-1">
          {esitmationSum()}
        </Badge>
        <div class={cx("flex", { "flex-col": isVertical() })}>
          <InsertAxisDialog orientation={props.config.axis.orientation} index={props.index} />
          <UpdateAxisDialog axis={props.config.axis} />
          <Show when={props.totalLength > 1 && tasks().length === 0}>
            <DeleteAxisDialog axisId={props.config.axis.id} />
          </Show>
        </div>
      </div>
    </div>
  );
};

const CenterRect: Component = () => {
  const boardModel = useBoardModelContext();

  return (
    <>
      <foreignObject x={0} y={0} width={AXIS_X_OFFSET} height={AXIS_Y_OFFSET}>
        <div class="grid grid-cols-1 grid-rows-[auto_1fr] p-1 bg-base-300 text-base-content w-full h-full">
          <span class="font-semibold truncate">{boardModel().board.title}</span>
          <span class="text-sm line-clamp-2 opacity-80">{boardModel().board.description}</span>
        </div>
      </foreignObject>
    </>
  );
};

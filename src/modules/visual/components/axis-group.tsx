import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Index, Show, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_OFFSET } from "../utils/constants";
import { DeleteAxisDialog, InsertAxisDialog, UpdateAxisDialog } from "./axis-dialogs";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  const xLength = createMemo(() => axisConfig().config.x.length);
  const yLength = createMemo(() => axisConfig().config.y.length);

  // const boardTransform = useBoardTransformContext();

  // const insertX = createMemo(
  //   () =>
  //     translateX(
  //       boardTransform().transform,
  //       (axisConfig().config.x.at(-1)?.end ?? 0) + AXIS_OFFSET,
  //     ) + BUTTON_PADDING,
  // );

  // const insertY = createMemo(
  //   () =>
  //     translateY(
  //       boardTransform().transform,
  //       (axisConfig().config.y.at(-1)?.end ?? 0) + AXIS_OFFSET,
  //     ) + BUTTON_PADDING,
  // );

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
      {/* <AxisInsertButton
        index={xLength() - 1}
        orientation="horizontal"
      />
      <AxisInsertButton
        index={yLength() - 1}
        orientation="vertical"
      /> */}
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  return <rect class="w-screen fill-base-300" x={0} y={0} height={100} />;
};

const VerticalBackgroundRect: Component = () => {
  return <rect class="h-screen fill-base-300" x={0} y={0} width={100} />;
};

type HorizontalItemRectProps = {
  config: AxisConfig;
  index: number;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  const width = createMemo(() => props.config.axis.size * boardTransform().transform.k);

  return (
    <>
      <foreignObject width={width()} x={transformed()} y={0} height={AXIS_OFFSET}>
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
    translateY(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  return (
    <>
      <foreignObject
        height={props.config.axis.size * boardTransform().transform.k}
        x={0}
        y={transformed()}
        width={AXIS_OFFSET}
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

  return (
    <div class="bg-base-200 w-full h-full flex px-3 py-1 gap-1">
      <div class="flex flex-col grow">
        <span>{props.config.axis.name}</span>
        <span>{props.config.axis.id}</span>
        <span>{esitmationSum()}</span>
      </div>
      <div>
        <InsertAxisDialog orientation={props.config.axis.orientation} index={props.index} />
        <UpdateAxisDialog axis={props.config.axis} />
        <Show when={props.totalLength > 1 && tasks().length === 0}>
          <DeleteAxisDialog axisId={props.config.axis.id} />
        </Show>
      </div>
    </div>
  );
};

import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Index, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_OFFSET } from "../utils/constants";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={axisConfig().config.x}>
        {(entry) => <HorizontalItemRect config={entry()} />}
      </Index>
      <Index each={axisConfig().config.y}>{(entry) => <VerticalItemRect config={entry()} />}</Index>
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  const boardTheme = useBoardThemeContext();

  return (
    <rect class="w-screen" x={0} y={0} height={100} fill={boardTheme().axisBoackgroundColor} />
  );
};

const VerticalBackgroundRect: Component = () => {
  const boardTheme = useBoardThemeContext();

  return <rect class="h-screen" x={0} y={0} width={100} fill={boardTheme().axisBoackgroundColor} />;
};

type HorizontalItemRectProps = {
  config: AxisConfig;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    boardTransform().translateX(props.config.start + AXIS_OFFSET),
  );

  return (
    <>
      <rect
        width={props.config.axis.size * boardTransform().transform().k}
        x={transformed()}
        y={0}
        height={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text x={transformed()} y={20}>
        {props.config.axis.name}
      </text>
      <text x={transformed()} y={40}>
        {props.config.axis.id}
      </text>
      <AxisSummaryText axis={props.config.axis} orientation="horizontal" x={transformed()} y={60} />
    </>
  );
};

type VerticalItemRectProps = {
  config: AxisConfig;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    boardTransform().translateY(props.config.start + AXIS_OFFSET),
  );

  return (
    <>
      <rect
        height={props.config.axis.size * boardTransform().transform().k}
        x={0}
        y={transformed()}
        width={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text y={transformed() + 20} x={0}>
        {props.config.axis.name}
      </text>
      <text y={transformed() + 40} x={0}>
        {props.config.axis.id}
      </text>
      <AxisSummaryText
        axis={props.config.axis}
        orientation="vertical"
        x={0}
        y={transformed() + 60}
      />
    </>
  );
};

type AxisSummaryTextProps = {
  axis: AxisModel;
  x: number;
  y: number;
  orientation: "vertical" | "horizontal";
};

const AxisSummaryText: Component<AxisSummaryTextProps> = (props) => {
  const collection = useLiveQuery((q) =>
    q
      .from({ tasks: taskCollection })
      .where(({ tasks }) =>
        props.axis.orientation === "horizontal"
          ? eq(tasks.axisX, props.axis.id)
          : eq(tasks.axisY, props.axis.id),
      ),
  );
  const esitmationSum = createMemo(() => {
    return collection.data.reduce((previous, current) => previous + current.estimate, 0);
  });

  return (
    <text y={props.y} x={props.x}>
      {esitmationSum()}
    </text>
  );
};

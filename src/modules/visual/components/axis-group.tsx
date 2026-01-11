import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, For, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_OFFSET } from "../utils/constants";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <For each={axisConfig().config.x}>
        {(entry) => <HorizontalItemRect axis={entry.axis} position={entry.start} />}
      </For>
      <For each={axisConfig().config.y}>
        {(entry) => <VerticalItemRect axis={entry.axis} position={entry.start} />}
      </For>
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
  axis: AxisModel;
  position: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateX(props.position + AXIS_OFFSET));

  return (
    <>
      <rect
        width={props.axis.size * boardTransform().transform().k}
        x={transformed()}
        y={0}
        height={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text x={transformed()} y={20}>
        {props.axis.name}
      </text>
      <text x={transformed()} y={40}>
        {props.axis.id}
      </text>
      <AxisSummaryText axis={props.axis} orientation="horizontal" x={transformed()} y={60} />
    </>
  );
};

type VerticalItemRectProps = {
  axis: AxisModel;
  position: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateY(props.position + AXIS_OFFSET));

  return (
    <>
      <rect
        height={props.axis.size * boardTransform().transform().k}
        x={0}
        y={transformed()}
        width={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text y={transformed() + 20} x={0}>
        {props.axis.name}
      </text>
      <text y={transformed() + 40} x={0}>
        {props.axis.id}
      </text>
      <AxisSummaryText axis={props.axis} orientation="vertical" x={0} y={transformed() + 60} />
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

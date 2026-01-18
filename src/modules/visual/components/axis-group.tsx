import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Index, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import {
  AXIS_DELETE_BUTTON_CLASS,
  AXIS_INSERT_BUTTON_CLASS,
  AXIS_OFFSET,
  AXIS_UPDATE_BUTTON_CLASS,
  BUTTON_PADDING,
  BUTTON_SIZE,
} from "../utils/constants";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={axisConfig().config.x}>
        {(entry, index) => <HorizontalItemRect config={entry()} index={index} />}
      </Index>
      <Index each={axisConfig().config.y}>
        {(entry, index) => <VerticalItemRect config={entry()} index={index} />}
      </Index>
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
  index: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  const width = createMemo(() => props.config.axis.size * boardTransform().transform.k);

  const endX = createMemo(() => transformed() + width());

  return (
    <>
      <rect
        width={width()}
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
      <AxisSummaryText axis={props.config.axis} x={transformed()} y={60} />
      <AxisInsertButton
        orientation={props.config.axis.orientation}
        index={props.index}
        x={endX() - BUTTON_SIZE - BUTTON_PADDING}
        y={BUTTON_PADDING}
      />
      <AxisUpdateButton
        axis={props.config.axis}
        x={endX() - BUTTON_SIZE - BUTTON_PADDING}
        y={BUTTON_PADDING + BUTTON_SIZE + BUTTON_PADDING}
      />
      <AxisDeleteButton
        axis={props.config.axis}
        x={endX() - BUTTON_SIZE - BUTTON_PADDING}
        y={BUTTON_PADDING + 2 * (BUTTON_SIZE + BUTTON_PADDING)}
      />
    </>
  );
};

type VerticalItemRectProps = {
  config: AxisConfig;
  index: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  const buttonX = AXIS_OFFSET - BUTTON_SIZE - BUTTON_PADDING;

  return (
    <>
      <rect
        height={props.config.axis.size * boardTransform().transform.k}
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
      <AxisSummaryText axis={props.config.axis} x={0} y={transformed() + 60} />
      <AxisInsertButton
        orientation={props.config.axis.orientation}
        index={props.index}
        x={buttonX}
        y={transformed() + BUTTON_PADDING}
      />
      <AxisUpdateButton
        axis={props.config.axis}
        x={buttonX}
        y={transformed() + BUTTON_PADDING + BUTTON_SIZE + BUTTON_PADDING}
      />
      <AxisDeleteButton
        axis={props.config.axis}
        x={buttonX}
        y={transformed() + BUTTON_PADDING + 2 * (BUTTON_SIZE + BUTTON_PADDING)}
      />
    </>
  );
};

type AxisSummaryTextProps = {
  axis: AxisModel;
  x: number;
  y: number;
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
    return collection().reduce((previous, current) => previous + current.estimate, 0);
  });

  return (
    <text y={props.y} x={props.x}>
      {esitmationSum()}
    </text>
  );
};

type AxisInsertButtonProps = {
  orientation: AxisModel["orientation"];
  index: number;
  x: number;
  y: number;
};

const AxisInsertButton: Component<AxisInsertButtonProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  return (
    <rect
      data-orientation={props.orientation}
      data-index={props.index}
      class={AXIS_INSERT_BUTTON_CLASS}
      x={props.x}
      y={props.y}
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      fill={boardTheme().taskMenuButtonBackgroundColor}
    />
  );
};

type AxisUpdateButtonProps = {
  axis: AxisModel;
  x: number;
  y: number;
};

const AxisUpdateButton: Component<AxisUpdateButtonProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  return (
    <rect
      data-axisId={props.axis.id}
      class={AXIS_UPDATE_BUTTON_CLASS}
      x={props.x}
      y={props.y}
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      fill={boardTheme().taskMenuButtonBackgroundColor}
    />
  );
};

type AxisDeleteButtonProps = {
  axis: AxisModel;
  x: number;
  y: number;
};

const AxisDeleteButton: Component<AxisDeleteButtonProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  return (
    <rect
      data-axisId={props.axis.id}
      class={AXIS_DELETE_BUTTON_CLASS}
      x={props.x}
      y={props.y}
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      fill={boardTheme().taskMenuButtonBackgroundColor}
    />
  );
};

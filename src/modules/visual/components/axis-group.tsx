import { createMemo, For, type Component } from "solid-js";
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
      <For each={axisConfig().config.horizontal.axis}>
        {(entry, index) => <HorizontalItemRect axis={entry} index={index()} />}
      </For>
      <For each={axisConfig().config.vertical.axis}>
        {(entry, index) => <VerticalItemRect axis={entry} index={index()} />}
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
  index: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();
  const axisConfig = useAxisConfigContext();

  const boardTransform = useBoardTransformContext();

  const position = createMemo(() => axisConfig().config.horizontal.positions[props.index]);
  const transformed = createMemo(() => boardTransform().translateX(position()));

  return (
    <>
      <rect
        width={props.axis.size * boardTransform().transform().k}
        x={transformed() + AXIS_OFFSET}
        y={0}
        height={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text x={transformed() + AXIS_OFFSET} y={20}>
        {props.axis.name}
      </text>
    </>
  );
};

type VerticalItemRectProps = {
  axis: AxisModel;
  index: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTheme = useBoardThemeContext();
  const axisConfig = useAxisConfigContext();

  const boardTransform = useBoardTransformContext();

  const position = createMemo(() => axisConfig().config.vertical.positions[props.index]);
  const transformed = createMemo(() => boardTransform().translateY(position()));

  return (
    <>
      <rect
        height={props.axis.size * boardTransform().transform().k}
        x={0}
        y={transformed() + AXIS_OFFSET}
        width={AXIS_OFFSET}
        fill={boardTheme().axisItemBoackgroundColor}
      />
      <text y={transformed() + AXIS_OFFSET + 20} x={0}>
        {props.axis.name}
      </text>
    </>
  );
};

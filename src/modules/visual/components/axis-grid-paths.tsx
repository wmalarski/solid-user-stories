import { createMemo, For, type Component } from "solid-js";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_OFFSET } from "../utils/constants";

export const AxisGridPaths: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalPath position={0} />
      <VerticalPath position={0} />
      <For each={axisConfig().config.y}>
        {(entry) => <HorizontalPath axisId={entry.axis.id} position={entry.end} />}
      </For>
      <For each={axisConfig().config.x}>
        {(entry) => <VerticalPath axisId={entry.axis.id} position={entry.end} />}
      </For>
    </>
  );
};

type HorizontalPathProps = {
  axisId?: string;
  position: number;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateY(props.position + AXIS_OFFSET));

  return (
    <rect x={0} class="w-full" y={transformed()} height={1} fill={boardTheme().axisGridColor} />
  );
};

type VerticalPathProps = {
  axisId?: string;
  position: number;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateX(props.position + AXIS_OFFSET));

  return (
    <rect y={0} class="h-screen" x={transformed()} width={1} fill={boardTheme().axisGridColor} />
  );
};

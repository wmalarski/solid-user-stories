import { createMemo, createSignal, For, type Component } from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useBoardTransformContext } from "../contexts/board-transform";
import { useDrag } from "../contexts/drag-state";
import { AXIS_OFFSET } from "../utils/constants";

export const AxisGridPaths: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalPath position={0} start={0} />
      <VerticalPath position={0} start={0} />
      <For each={axisConfig().config.y}>
        {(entry) => (
          <HorizontalPath axisId={entry.axis.id} start={entry.start} position={entry.end} />
        )}
      </For>
      <For each={axisConfig().config.x}>
        {(entry) => (
          <VerticalPath axisId={entry.axis.id} start={entry.start} position={entry.end} />
        )}
      </For>
    </>
  );
};

type HorizontalPathProps = {
  axisId?: string;
  position: number;
  start: number;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateY(props.position + AXIS_OFFSET));

  useDrag({
    onDragged(event) {
      if (props.axisId) {
        const transform = boardTransform().transform();
        const size = (event.y - transform.y) / transform.k - AXIS_OFFSET - props.start;
        axisCollection.update(props.axisId, (draft) => {
          draft.size = size;
        });
      }
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      x={0}
      class="w-full"
      y={transformed()}
      height={2}
      fill={boardTheme().axisGridColor}
    />
  );
};

type VerticalPathProps = {
  axisId?: string;
  position: number;
  start: number;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const boardTheme = useBoardThemeContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateX(props.position + AXIS_OFFSET));

  useDrag({
    onDragged(event) {
      if (props.axisId) {
        const transform = boardTransform().transform();
        const size = (event.x - transform.x) / transform.k - AXIS_OFFSET - props.start;
        axisCollection.update(props.axisId, (draft) => {
          draft.size = size;
        });
      }
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      y={0}
      class="h-screen"
      x={transformed()}
      width={2}
      fill={boardTheme().axisGridColor}
    />
  );
};

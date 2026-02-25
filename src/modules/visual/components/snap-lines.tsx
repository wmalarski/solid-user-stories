import { createMemo, Show, type Component, type ComponentProps } from "solid-js";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useSnapPositionContext } from "../contexts/drag-state";
import { SNAP_SIZE } from "../utils/constants";

const sharedProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "2,2",
  "stroke-opacity": 0.5,
  "stroke-width": 1,
};

export const SnapLines: Component = () => {
  const [transform] = useBoardTransformContext();
  const [snapPosition] = useSnapPositionContext();

  return (
    <Show when={snapPosition()}>
      {(snapPositionResolved) => {
        const x = createMemo(() =>
          translateX(transform(), Math.floor(snapPositionResolved().x / SNAP_SIZE) * SNAP_SIZE),
        );
        const y = createMemo(() =>
          translateY(transform(), Math.floor(snapPositionResolved().y / SNAP_SIZE) * SNAP_SIZE),
        );
        return (
          <>
            <line x1={0} x2="100%" y1={y()} y2={y()} {...sharedProps} />
            <line y1={0} y2="100%" x1={x()} x2={x()} {...sharedProps} />
          </>
        );
      }}
    </Show>
  );
};

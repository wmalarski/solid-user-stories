import { createMemo, Show, type Component, type ComponentProps } from "solid-js";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { getSnapPosition, useSnapPositionContext } from "../contexts/drag-state";

const sharedProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "2,2",
  "stroke-opacity": 0.5,
  "stroke-width": 1,
};

export const SnapLines: Component = () => {
  const [transform] = useBoardTransformContext();
  const [dragPosition] = useSnapPositionContext();

  return (
    <Show when={dragPosition()}>
      {(resolvedPosition) => {
        const x = createMemo(() => translateX(transform(), getSnapPosition(resolvedPosition().x)));
        const y = createMemo(() => translateY(transform(), getSnapPosition(resolvedPosition().y)));
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
